import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  collection
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useParams, useNavigate } from "react-router-dom";
import "../style/AdoptionRequestDetail.css";

function AdoptionRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [request, setRequest] = useState(null);
  const [pet, setPet] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusLabel = {
    pending: "Pendiente",
    approved: "En conversación",
    completed: "Adopción completada",
    cancelled: "Rechazada"
  };

  useEffect(() => {
    const loadData = async () => {
      const reqSnap = await getDoc(doc(db, "adoptionRequests", id));
      if (!reqSnap.exists()) {
        setLoading(false);
        return;
      }

      const reqData = reqSnap.data();
      setRequest({ id: reqSnap.id, ...reqData });

      const petSnap = await getDoc(doc(db, "pets", reqData.petId));
      if (petSnap.exists()) setPet(petSnap.data());

      const otherUserId =
        reqData.ownerId === user.uid
          ? reqData.requesterId
          : reqData.ownerId;

      const userSnap = await getDoc(doc(db, "users", otherUserId));
      if (userSnap.exists()) setOtherUser(userSnap.data());

      setLoading(false);
    };

    loadData();
  }, [id, user]);

  if (loading) return <p className="detail__loading">Cargando solicitud…</p>;
  if (!request) return <p>Solicitud no encontrada.</p>;

  const isOwner = request.ownerId === user.uid;
  const profileUid =
    isOwner ? request.requesterId : request.ownerId;

  const startChat = async () => {
    const chatRef = await addDoc(collection(db, "chats"), {
      petId: request.petId,
      requestId: request.id,
      ownerId: request.ownerId,
      adopterId: request.requesterId,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "adoptionRequests", request.id), {
      chatId: chatRef.id,
      status: "approved"
    });

    navigate(`/chat/${chatRef.id}`);
  };

  const confirmAdoption = async () => {
    await updateDoc(doc(db, "pets", request.petId), {
      previousOwnerId: request.ownerId,
      ownerId: request.requesterId,
      adopted: true,
      adoptedAt: serverTimestamp(),
      isAdoptable: false
    });

    await updateDoc(doc(db, "adoptionRequests", request.id), {
      status: "completed",
      completedAt: serverTimestamp()
    });

    navigate("/adoption-requests");
  };

  const rejectRequest = async () => {
    await updateDoc(doc(db, "adoptionRequests", request.id), {
      status: "cancelled"
    });
    navigate("/adoption-requests");
  };

  const deleteRequest = async () => {
    await deleteDoc(doc(db, "adoptionRequests", request.id));
    navigate("/adoption-requests");
  };

  return (
    <div className="detail">
      <header className="detail__header">
        <button onClick={() => navigate(-1)}>⬅</button>
        <h2>Solicitud de adopción</h2>
      </header>

      <div className="status">
        Estado: <strong>{statusLabel[request.status]}</strong>
      </div>

      {pet && (
        <div className="card petCard">
          <img src={pet.photoURL} alt={pet.name} />
          <div>
            <h3>{pet.name}</h3>
            <p>{pet.species} · {pet.age} años</p>
          </div>
        </div>
      )}

      {otherUser && (
        <div
          className="card userCard"
          onClick={() => navigate(`/profile/${profileUid}`)}
        >
          {otherUser.photoURL && (
            <img src={otherUser.photoURL} alt="usuario" />
          )}
          <div>
            <p className="label">
              {isOwner ? "Solicitante" : "Dueño"}
            </p>
            <strong>
              {otherUser.firstName} {otherUser.lastName}
            </strong>
            <p>{otherUser.email}</p>
          </div>
        </div>
      )}

      <div className="actions">
        {isOwner && request.status === "pending" && (
          <button className="primary" onClick={startChat}>
            💬 Iniciar chat
          </button>
        )}

        {isOwner &&
          (request.status === "pending" ||
            request.status === "approved") && (
            <button className="danger" onClick={rejectRequest}>
              ❌ Rechazar solicitud
            </button>
          )}

        {isOwner && request.status === "approved" && (
          <button className="confirm" onClick={confirmAdoption}>
            ✅ Confirmar adopción
          </button>
        )}

        {(request.status === "cancelled" ||
          request.status === "completed") && (
          <button className="delete" onClick={deleteRequest}>
            🗑️ Eliminar solicitud
          </button>
        )}
      </div>
    </div>
  );
}

export default AdoptionRequestDetail;
