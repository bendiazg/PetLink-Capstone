import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../services/firebase";
import { getAuthErrorMessage } from "../utils/firebaseErrors";
import "../style/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Debes verificar tu correo antes de iniciar sesión.");
        return;
      }

      navigate("/");
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <div className="login__logo">🐾</div>
          <h1>PetLink</h1>
          <p>Conecta con tu próxima mascota</p>
        </div>

        <form className="login__form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="login__error">{error}</p>}

          <button type="submit">Iniciar sesión</button>
        </form>

        <p className="login__footer">
          ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
