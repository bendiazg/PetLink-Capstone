import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../style/Chats.css";

function Chats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q1 = query(collection(db, "chats"), where("ownerId", "==", user.uid));
    const q2 = query(collection(db, "chats"), where("adopterId", "==", user.uid));

    const map = {};
    let unsub1, unsub2;

    const loadChat = async (id, data) => {
      const otherUserId =
        data.ownerId === user.uid ? data.adopterId : data.ownerId;

      const [userSnap, petSnap] = await Promise.all([
        getDoc(doc(db, "users", otherUserId)),
        getDoc(doc(db, "pets", data.petId))
      ]);

      map[id] = {
        id,
        ...data,
        otherUser: userSnap.exists()
          ? { uid: otherUserId, ...userSnap.data() }
          : null,
        pet: petSnap.exists() ? petSnap.data() : null
      };

      setChats(
        Object.values(map).sort(
          (a, b) =>
            (b.lastMessageAt?.seconds || 0) -
            (a.lastMessageAt?.seconds || 0)
        )
      );
      setLoading(false);
    };

    unsub1 = onSnapshot(q1, snap =>
      snap.docs.forEach(d => loadChat(d.id, d.data()))
    );
    unsub2 = onSnapshot(q2, snap =>
      snap.docs.forEach(d => loadChat(d.id, d.data()))
    );

    return () => {
      unsub1 && unsub1();
      unsub2 && unsub2();
    };
  }, [user]);

  if (loading) return <p className="chats__loading">Cargando chats…</p>;

  return (
    <div className="chats">
      <h2>Chats</h2>

      {chats.length === 0 && (
        <p className="chats__empty">No tienes conversaciones.</p>
      )}

      {chats.map(chat => {
        const unread = chat.unreadCount?.[user.uid] || 0;

        return (
          <div
            key={chat.id}
            className="chatItem"
            onClick={() => navigate(`/chat/${chat.id}`)}
          >
            {chat.otherUser?.photoURL ? (
              <img src={chat.otherUser.photoURL} alt="perfil" />
            ) : (
              <div className="avatarPlaceholder" />
            )}

            <div className="chatItem__info">
              <strong>
                {chat.otherUser?.firstName} {chat.otherUser?.lastName}
              </strong>
              <p>
                {chat.lastMessage ||
                  `Solicitud de adopción de ${chat.pet?.name}`}
              </p>
            </div>

            {unread > 0 && (
              <span className="chatItem__badge">{unread}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Chats;
