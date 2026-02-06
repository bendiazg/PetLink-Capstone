import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../services/firebase";
import { useParams, useNavigate } from "react-router-dom";
import CommunityPostPreview from "../components/CommunityPostPreview";
import "../style/CommunityDetail.css";

function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [posting, setPosting] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), snap => {
      if (snap.exists()) setUserProfile(snap.data());
    });
  }, [user]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "communities", id));
      if (!snap.exists()) return;

      const data = { id: snap.id, ...snap.data() };
      setCommunity(data);
      setIsOwner(user?.uid === data.ownerId);

      if (!user) return;

      const memberQ = query(
        collection(db, "communityMembers"),
        where("communityId", "==", id),
        where("userId", "==", user.uid)
      );

      onSnapshot(memberQ, snap => {
        if (!snap.empty) {
          setIsMember(true);
          setIsAdmin(snap.docs[0].data().role === "admin");
        } else {
          setIsMember(false);
          setIsAdmin(false);
        }
      });

      const reqQ = query(
        collection(db, "communityJoinRequests"),
        where("communityId", "==", id),
        where("userId", "==", user.uid),
        where("status", "==", "pending")
      );

      onSnapshot(reqQ, snap => setHasRequested(!snap.empty));
    };

    load();
  }, [id, user]);

  useEffect(() => {
    const q = query(
      collection(db, "communityPosts"),
      where("communityId", "==", id)
    );

    return onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => !p.hidden);

      data.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });

      setPosts(data);
    });
  }, [id]);

  const handleJoin = async () => {
    if (!user) return navigate("/login");

    if (community.isPrivate) {
      await addDoc(collection(db, "communityJoinRequests"), {
        communityId: id,
        userId: user.uid,
        status: "pending",
        createdAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, "communityMembers"), {
        communityId: id,
        userId: user.uid,
        role: "member",
        joinedAt: serverTimestamp()
      });

      await updateDoc(doc(db, "communities", id), {
        membersCount: (community.membersCount || 0) + 1
      });
    }
  };

  const handleLeave = async () => {
    if (isOwner) {
      if (community.membersCount === 1) {
        if (!window.confirm("Eres el único miembro. ¿Eliminar comunidad?")) return;

        await deleteDoc(doc(db, "communities", id));
        navigate("/communities");
      } else {
        alert("Transfiere la propiedad antes de salir.");
      }
      return;
    }

    if (!window.confirm("¿Seguro que quieres salir de esta comunidad?")) return;

    const q = query(
      collection(db, "communityMembers"),
      where("communityId", "==", id),
      where("userId", "==", user.uid)
    );

    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map(d => deleteDoc(doc(db, "communityMembers", d.id)))
    );

    await updateDoc(doc(db, "communities", id), {
      membersCount: Math.max((community.membersCount || 1) - 1, 0)
    });

    navigate("/communities");
  };

  const handleCreatePost = async () => {
    if (!text.trim() || !isMember || !userProfile) return;
    if (images.length > 5) return alert("Máximo 5 imágenes");

    setPosting(true);

    const uploaded = [];
    for (const file of images) {
      const imgRef = ref(
        storage,
        `communityPosts/${id}/${Date.now()}_${file.name}`
      );
      await uploadBytes(imgRef, file);
      uploaded.push(await getDownloadURL(imgRef));
    }

    await addDoc(collection(db, "communityPosts"), {
      communityId: id,
      authorId: user.uid,
      authorName: `${userProfile.firstName} ${userProfile.lastName}`,
      authorPhotoURL: userProfile.photoURL || "",
      authorRole: isAdmin ? "admin" : "member",
      text,
      images: uploaded,
      pinned: false,
      hidden: false,
      reactionsCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp()
    });

    setText("");
    setImages([]);
    setPosting(false);
  };

  if (!community) return <p>Cargando comunidad...</p>;

  return (
    <div className="communityDetail">
      {community.bannerURL && (
        <img src={community.bannerURL} className="banner" alt="banner" />
      )}

      <div className="header">
        {community.photoURL && (
          <img src={community.photoURL} className="avatar" alt="avatar" />
        )}
        <div>
          <h2>{community.name}</h2>
          <button
            className="membersBtn"
            onClick={() => navigate(`/communities/${id}/members`)}
          >
            👥 {community.membersCount || 0} miembros
          </button>
        </div>
      </div>

      <p className={`description ${showFullDesc ? "full" : ""}`}>
        {community.description}
      </p>

      {community.description?.length > 220 && (
        <button className="descToggle" onClick={() => setShowFullDesc(v => !v)}>
          {showFullDesc ? "Ver menos" : "Ver más"}
        </button>
      )}

      {!isMember && (
        <button className="joinBtn" onClick={handleJoin}>
          {community.isPrivate
            ? hasRequested ? "Solicitud enviada" : "Solicitar unirse"
            : "Unirse"}
        </button>
      )}

      {isMember && (
        <button className="leaveBtn" onClick={handleLeave}>
          {isOwner && community.membersCount === 1
            ? "🗑 Eliminar comunidad"
            : "🚪 Salir de la comunidad"}
        </button>
      )}

      <h3>Publicaciones</h3>

      {isMember && (
        <div className="composer">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe una publicación…"
          />

          <label className="uploadBox">
            📷 Agregar imágenes
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={e => setImages([...e.target.files])}
            />
          </label>

          <button onClick={handleCreatePost} disabled={posting}>
            {posting ? "Publicando..." : "Publicar"}
          </button>
        </div>
      )}

      {posts.map(p => (
        <CommunityPostPreview key={p.id} post={p} communityId={id} />
      ))}
    </div>
  );
}

export default CommunityDetail;
