import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { useNavigate, useParams } from "react-router-dom";
import "../style/Profile.css";

function Profile() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;
  const profileUid = uid || currentUser?.uid;
  const isOwnProfile = currentUser?.uid === profileUid;

  useEffect(() => {
    if (!profileUid) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", profileUid));
      if (snap.exists()) setUserData(snap.data());
      setLoading(false);
    };

    fetchUser();
  }, [profileUid, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  if (loading) return <p className="profile__loading">Cargando perfil...</p>;
  if (!userData) return <p>No se pudo cargar el perfil.</p>;

  const locationText = userData.location
    ? `${userData.location.comuna}, ${userData.location.region}`
    : "Ubicación no definida";

  return (
    <div className="profile">
      <div className="profile__header">
        <img
          src={userData.photoURL || "/avatar-placeholder.png"}
          alt="Perfil"
          className="profile__avatar"
        />
        <h1>{userData.firstName} {userData.lastName}</h1>
        <p>{locationText}</p>
      </div>

      <div className="profile__card">
        <div className="profile__row">
          <span>Correo</span>
          <span>{userData.email}</span>
        </div>

        {isOwnProfile && (
          <>
            <div className="profile__row">
              <span>Teléfono</span>
              <span>{userData.phone}</span>
            </div>

            <div className="profile__row">
              <span>Fecha nacimiento</span>
              <span>{userData.birthDate}</span>
            </div>

            <button
              className="primary"
              onClick={() => navigate("/profile/edit")}
            >
              Editar perfil
            </button>

            <button
              className="danger"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
