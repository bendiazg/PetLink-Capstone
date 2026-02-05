import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useNavigate } from "react-router-dom";

function Notifications() {

  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetchNotifications();
  }, [user]);

  const openNotification = async (n) => {
    await updateDoc(doc(db, "notifications", n.id), {
      read: true
    });

    navigate(n.link);
  };

  return (
    <div>
      <h2>Notificaciones</h2>

      {notifications.length === 0 && <p>No tienes notificaciones.</p>}

      {notifications.map(n => (
        <div
          key={n.id}
          onClick={() => openNotification(n)}
          style={{
            padding: "10px",
            borderBottom: "1px solid #ccc",
            background: n.read ? "#fff" : "#eef",
            cursor: "pointer"
          }}
        >
          {n.text}
        </div>
      ))}
    </div>
  );
}

export default Notifications;
