import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../style/AdoptionRequests.css";

function AdoptionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const statusLabel = {
    pending: "Pendiente",
    approved: "En conversación",
    completed: "Adopción completada",
    cancelled: "Rechazada"
  };

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;

      const q1 = query(
        collection(db, "adoptionRequests"),
        where("ownerId", "==", user.uid)
      );

      const q2 = query(
        collection(db, "adoptionRequests"),
        where("requesterId", "==", user.uid)
      );

      const [snap1, snap2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const all = [...snap1.docs, ...snap2.docs];

      const enriched = await Promise.all(
        all.map(async d => {
          const data = d.data();

          const petSnap = await getDoc(doc(db, "pets", data.petId));
          const pet = petSnap.exists() ? petSnap.data() : null;

          const otherUserId =
            data.ownerId === user.uid ? data.requesterId : data.ownerId;

          const userSnap = await getDoc(doc(db, "users", otherUserId));
          const otherUser = userSnap.exists() ? userSnap.data() : null;

          return {
            id: d.id,
            ...data,
            pet,
            otherUser
          };
        })
      );

      setRequests(enriched);
      setLoading(false);
    };

    fetchRequests();
  }, [user]);

  const handleReject = async (id) => {
    await updateDoc(doc(db, "adoptionRequests", id), {
      status: "cancelled"
    });

    setRequests(reqs =>
      reqs.map(r =>
        r.id === id ? { ...r, status: "cancelled" } : r
      )
    );
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "adoptionRequests", id));
    setRequests(reqs => reqs.filter(r => r.id !== id));
  };

  if (loading) return <p className="requests__loading">Cargando solicitudes…</p>;

  return (
    <div className="requests">
      <h2>Solicitudes de adopción</h2>

      {requests.length === 0 && (
        <p className="requests__empty">No tienes solicitudes.</p>
      )}

      {requests.map(req => {
        const isOwner = req.ownerId === user.uid;
        const profileUid =
          isOwner ? req.requesterId : req.ownerId;

        return (
          <div
            key={req.id}
            className="requestCard"
            onClick={() => navigate(`/adoption-requests/${req.id}`)}
          >
            <div className="requestCard__top">
              {req.pet?.photoURL && (
                <img src={req.pet.photoURL} alt={req.pet.name} />
              )}
              <div>
                <h3>{req.pet?.name || "Mascota"}</h3>
                <p>{statusLabel[req.status]}</p>
              </div>
            </div>

            <div
              className="requestCard__user"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${profileUid}`);
              }}
            >
              {req.otherUser?.photoURL && (
                <img src={req.otherUser.photoURL} alt="usuario" />
              )}
              <span>
                {isOwner ? "Solicitud de " : "Enviado a "}
                <strong>
                  {req.otherUser
                    ? `${req.otherUser.firstName} ${req.otherUser.lastName}`
                    : "Usuario"}
                </strong>
              </span>
            </div>

            <div
              className="requestCard__actions"
              onClick={(e) => e.stopPropagation()}
            >
              {isOwner &&
                (req.status === "pending" ||
                  req.status === "approved") && (
                  <button
                    className="reject"
                    onClick={() => handleReject(req.id)}
                  >
                    Rechazar
                  </button>
                )}

              {(req.status === "cancelled" ||
                req.status === "completed") && (
                <button
                  className="delete"
                  onClick={() => handleDelete(req.id)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdoptionRequests;
