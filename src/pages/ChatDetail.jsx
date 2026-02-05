import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useParams, useNavigate } from "react-router-dom";
import "../style/ChatDetail.css";

function ChatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chatData, setChatData] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    const loadChat = async () => {
      const snap = await getDoc(doc(db, "chats", id));
      if (!snap.exists()) return;

      const data = snap.data();
      setChatData({ id: snap.id, ...data });

      const otherUserId =
        data.ownerId === user.uid ? data.adopterId : data.ownerId;

      const [userSnap, petSnap] = await Promise.all([
        getDoc(doc(db, "users", otherUserId)),
        getDoc(doc(db, "pets", data.petId))
      ]);

      if (userSnap.exists()) {
        setOtherUser({ uid: otherUserId, ...userSnap.data() });
      }

      if (petSnap.exists()) setPet(petSnap.data());

      setLoading(false);
    };

    loadChat();
  }, [id, user]);

  useEffect(() => {
    if (!chatData) return;

    const q = query(
      collection(db, "chats", id, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [id, chatData]);

  useEffect(() => {
    if (!chatData || !user) return;

    updateDoc(doc(db, "chats", id), {
      [`unreadCount.${user.uid}`]: 0
    });
  }, [id, chatData, user]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const otherUserId =
      chatData.ownerId === user.uid
        ? chatData.adopterId
        : chatData.ownerId;

    await addDoc(collection(db, "chats", id, "messages"), {
      senderId: user.uid,
      text,
      type: "text",
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "chats", id), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      [`unreadCount.${otherUserId}`]: increment(1)
    });

    setText("");
  };

  if (loading) return <p className="chatDetail__loading">Cargando chat…</p>;
  if (!chatData) return <p>Chat no encontrado.</p>;

  const blocked =
    chatData.status === "cancelled" ||
    chatData.status === "completed";

  return (
    <div className="chatDetail">
      <header className="chatDetail__header">
        <button onClick={() => navigate(-1)}>⬅</button>

        <div
          className="chatDetail__user"
          onClick={() => navigate(`/profile/${otherUser.uid}`)}
        >
          {otherUser?.photoURL && (
            <img src={otherUser.photoURL} alt="perfil" />
          )}
          <div>
            <strong>
              {otherUser?.firstName} {otherUser?.lastName}
            </strong>
            <span onClick={() => navigate(`/pets/${chatData.petId}`)}>
              🐾 {pet?.name}
            </span>
          </div>
        </div>

        <button
          onClick={() =>
            navigate(`/adoption-requests/${chatData.requestId}`)
          }
        >
          📄
        </button>
      </header>

      <div className="chatDetail__messages">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`message ${
              msg.senderId === user.uid ? "own" : ""
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {blocked ? (
        <div className="chatDetail__blocked">
          Esta conversación fue cerrada.
        </div>
      ) : (
        <div className="chatDetail__input">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe un mensaje…"
          />
          <button onClick={sendMessage}>Enviar</button>
        </div>
      )}
    </div>
  );
}

export default ChatDetail;
