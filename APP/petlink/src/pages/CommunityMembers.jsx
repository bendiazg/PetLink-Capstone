import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useParams, useNavigate } from "react-router-dom";
import "../style/CommunityMembers.css";

function CommunityMembers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    const loadMembers = async () => {
      const q = query(
        collection(db, "communityMembers"),
        where("communityId", "==", id)
      );

      const snap = await getDocs(q);

      const data = await Promise.all(
        snap.docs.map(async d => {
          const m = d.data();
          const userSnap = await getDoc(doc(db, "users", m.userId));

          return {
            id: d.id, // ✅ ID REAL DEL DOCUMENTO
            ...m,
            user: userSnap.exists() ? userSnap.data() : null
          };
        })
      );

      setMembers(data);

      const me = data.find(m => m.userId === user?.uid);
      setMyRole(me?.role || null);
    };

    loadMembers();
  }, [id, user]);

  const promote = async (memberDocId) => {
    await updateDoc(doc(db, "communityMembers", memberDocId), {
      role: "admin"
    });
  };

  const demote = async (memberDocId) => {
    await updateDoc(doc(db, "communityMembers", memberDocId), {
      role: "member"
    });
  };

  const remove = async (memberDocId) => {
    if (!window.confirm("¿Expulsar miembro?")) return;
    await deleteDoc(doc(db, "communityMembers", memberDocId));
  };

  const block = async (member) => {
    if (!window.confirm("¿Bloquear usuario del grupo?")) return;

    await addDoc(collection(db, "communityBlockedUsers"), {
      communityId: id,
      userId: member.userId,
      createdAt: serverTimestamp()
    });

    await remove(member.id);
  };

  return (
    <div className="communityMembers">
      <h2>Miembros</h2>

      {members.map(m => (
        <div
          key={m.id}
          className="memberCard"
          onClick={() => navigate(`/profile/${m.userId}`)}
        >
          <img
            src={m.user?.photoURL || "/avatar.png"}
            alt="avatar"
          />

          <div className="memberInfo">
            <strong>
              {m.user?.firstName} {m.user?.lastName}
            </strong>
            <span>{m.role.toUpperCase()}</span>
          </div>

          {myRole === "admin" && m.userId !== user.uid && (
            <div
              className="memberActions"
              onClick={e => e.stopPropagation()}
            >
              {m.role === "member" ? (
                <button onClick={() => promote(m.id)}>Hacer admin</button>
              ) : (
                <button onClick={() => demote(m.id)}>Quitar admin</button>
              )}

              <button onClick={() => remove(m.id)}>Expulsar</button>

              <button
                className="danger"
                onClick={() => block(m)}
              >
                Bloquear
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default CommunityMembers;
