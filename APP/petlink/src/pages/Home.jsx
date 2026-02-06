import { useNavigate } from "react-router-dom";
import "../style/Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">

      <header className="home__header">
        <div>
          <h1 className="home__title">PetLink</h1>
          <p className="home__subtitle">
            Conecta personas y mascotas en tu comunidad
          </p>
        </div>

        <button
          className="home__profileBtn"
          onClick={() => navigate("/profile")}
        >
          👤
        </button>
      </header>

      <main className="home__content">

        <button
          className="home__cta"
          onClick={() => navigate("/pets/search")}
        >
          🐾 Buscar mascotas
        </button>

        <div
          className="card card--map"
          onClick={() => navigate("/map")}
        >
          <div className="map-preview">
            <h3>Mapa PetLink</h3>
            <p>Veterinarias, parques y tiendas cercanas</p>
          </div>
        </div>

        <div className="card card--pets">
          <h3>Mis mascotas</h3>

          <button
            className="pets__main"
            onClick={() => navigate("/pets")}
          >
            🐶 Ver mis mascotas
          </button>

          <div className="pets__actions">
            <button onClick={() => navigate("/pets/create")}>
              ➕ Registrar
            </button>
            <button onClick={() => navigate("/adoption-requests")}>
              📄 Solicitudes
            </button>
          </div>
        </div>

        <div
          className="card card--community"
          onClick={() => navigate("/communities")}
        >
          <h3>Comunidades</h3>
          <p>Grupos y personas cerca de ti</p>

          <div className="community-preview">
            <span>🐶 DogLovers</span>
            <span>🐱 CatChile</span>
            <span>🐾 Adopciones RM</span>
          </div>
        </div>

        <button
          className="chat-btn"
          onClick={() => navigate("/chats")}
        >
          💬
          <div>
            <strong>Chats</strong>
            <span>Conversaciones activas</span>
          </div>
        </button>

      </main>

      <nav className="home__nav">
        <button onClick={() => navigate("/pets/search")}>🐾</button>
        <button onClick={() => navigate("/map")}>🗺️</button>
        <button onClick={() => navigate("/communities")}>👥</button>
        <button onClick={() => navigate("/chats")}>💬</button>
      </nav>

    </div>
  );
}

export default Home;
