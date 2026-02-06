import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import "../style/MyPets.css";

function MyPets() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyPets = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "pets"),
          where("ownerId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        const petsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPets(petsData);
      } catch {
        setError("No se pudieron cargar tus mascotas.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyPets();
  }, []);

  if (loading) return <p className="pets__loading">Cargando tus mascotas...</p>;
  if (error) return <p className="pets__error">{error}</p>;

  return (
    <div className="pets">
      <header className="pets__header">
        <h1>Mis mascotas</h1>
        <button onClick={() => navigate("/pets/create")}>
          ➕ Nueva mascota
        </button>
      </header>

      {pets.length === 0 && (
        <div className="pets__empty">
          <p>Aún no has publicado mascotas.</p>
          <button onClick={() => navigate("/pets/create")}>
            Publicar primera mascota
          </button>
        </div>
      )}

      <div className="pets__grid">
        {pets.map(pet => (
          <div
            className="petCard clickable"
            key={pet.id}
            onClick={() => navigate(`/pets/${pet.id}`)}
          >
            <div className="petCard__image">
              {pet.photoURL ? (
                <img src={pet.photoURL} alt={pet.name} />
              ) : (
                <div className="petCard__placeholder">🐾</div>
              )}
            </div>

            <div className="petCard__info">
              <h3>{pet.name}</h3>
              <p className="petCard__meta">
                {pet.species} · {pet.age} años
              </p>

              {pet.location && (
                <p className="petCard__location">
                  📍 {pet.location.comuna}
                </p>
              )}
            </div>

            <button
              className="petCard__edit"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/pets/edit/${pet.id}`);
              }}
            >
              Editar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyPets;
