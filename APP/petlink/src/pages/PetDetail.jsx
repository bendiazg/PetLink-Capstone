import { useEffect, useState } from "react";
import { doc, getDoc, addDoc, serverTimestamp, collection } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../services/firebase";
import "../style/PetDetail.css";

function PetDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const snap = await getDoc(doc(db, "pets", id));
        if (!snap.exists()) {
          setError("Mascota no encontrada.");
          return;
        }
        setPet({ id: snap.id, ...snap.data() });
      } catch {
        setError("No se pudo cargar la mascota.");
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [id]);

  const handleRequestAdoption = async () => {
    const user = auth.currentUser;
    if (!user) return navigate("/login");

    try {
      setSending(true);
      await addDoc(collection(db, "adoptionRequests"), {
        petId: pet.id,
        ownerId: pet.ownerId,
        requesterId: user.uid,
        status: "pending",
        createdAt: serverTimestamp()
      });
      alert("Solicitud enviada correctamente.");
    } catch {
      alert("No se pudo enviar la solicitud.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p className="petDetail__loading">Cargando mascota...</p>;
  if (error) return <p className="petDetail__error">{error}</p>;

  const user = auth.currentUser;
  const canRequest =
    pet.isAdoptable &&
    !pet.adopted &&
    user &&
    pet.ownerId !== user.uid;

  return (
    <div className="petDetail">
      <header className="petDetail__header">
        <button onClick={() => navigate(-1)}>⬅</button>
        <h1>{pet.name}</h1>
      </header>

      <div className="petDetail__image">
        {pet.photoURL ? (
          <img src={pet.photoURL} alt={pet.name} />
        ) : (
          <div className="placeholder">🐾</div>
        )}
      </div>

      {pet.photos?.length > 0 && (
        <div className="petGallery">
          {pet.photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt="Galería mascota"
              onClick={() => setActivePhoto(url)}
            />
          ))}
        </div>
      )}

      <div className="petDetail__content">
        <div className="card basic">
          <p><strong>Especie:</strong> {pet.species}</p>
          <p><strong>Edad:</strong> {pet.age} años</p>
        </div>

        <div className="card">
          <h3>🩺 Salud</h3>
          <p>Vacunado: {pet.health?.vaccinated ? "Sí" : "No"}</p>
          <p>Esterilizado: {pet.health?.sterilized ? "Sí" : "No"}</p>
          <p>Desparasitado: {pet.health?.dewormed ? "Sí" : "No"}</p>
          {pet.health?.vaccines?.length > 0 && (
            <p>Vacunas: {pet.health.vaccines.join(", ")}</p>
          )}
        </div>

        <div className="card">
          <h3>🐕 Comportamiento</h3>
          <p>Niños: {pet.behavior?.goodWithKids ? "Sí" : "No"}</p>
          <p>Perros: {pet.behavior?.goodWithDogs ? "Sí" : "No"}</p>
          <p>Gatos: {pet.behavior?.goodWithCats ? "Sí" : "No"}</p>
          <p>Energía: {pet.behavior?.energyLevel}</p>
        </div>

        <div className="card">
          <h3>🏠 Contexto ideal</h3>
          <p>Tamaño: {pet.context?.size}</p>
          <p>Vivienda ideal: {pet.context?.livingPlace}</p>
          <p>Necesidades especiales: {pet.context?.specialNeeds ? "Sí" : "No"}</p>
        </div>
      </div>

      {canRequest && (
        <div className="petDetail__cta">
          <button onClick={handleRequestAdoption} disabled={sending}>
            {sending ? "Enviando..." : "Solicitar adopción"}
          </button>
        </div>
      )}

      {activePhoto && (
        <div className="photoModal" onClick={() => setActivePhoto(null)}>
          <img src={activePhoto} alt="Vista completa" />
        </div>
      )}
    </div>
  );
}

export default PetDetail;
