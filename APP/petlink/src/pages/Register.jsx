import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../services/firebase";
import { getAuthErrorMessage } from "../utils/firebaseErrors";
import ImageCropper from "../components/ImageCropper";
import { getCroppedImage } from "../utils/imageCrop";
import "../style/Register.css";

function Register() {
  const [regions, setRegions] = useState([]);
  const [comunas, setComunas] = useState([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    regionId: "",
    regionName: "",
    comuna: "",
    birthDate: ""
  });

  const [imageSrc, setImageSrc] = useState(null);
  const [cropPixels, setCropPixels] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadRegions = async () => {
      const snap = await getDocs(collection(db, "locations"));
      setRegions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadRegions();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegionChange = (e) => {
    const region = regions.find(r => r.id === e.target.value);
    if (!region) return;

    setForm(prev => ({
      ...prev,
      regionId: region.id,
      regionName: region.region,
      comuna: ""
    }));

    setComunas(region.comunas || []);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageSrc(URL.createObjectURL(file));
    setShowCropper(true);
  };
  
  const [preview, setPreview] = useState(null);

  const handleConfirmCrop = async () => {
    const blob = await getCroppedImage(imageSrc, cropPixels);
    setCroppedBlob(blob);
    setPreview(URL.createObjectURL(blob));
    setShowCropper(false);
    setImageSrc(null);
  };
  

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = cred.user;
      let photoURL = "";

      if (croppedBlob) {
        const photoRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(photoRef, croppedBlob);
        photoURL = await getDownloadURL(photoRef);
      }

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        ...form,
        photoURL,
        role: "user",
        createdAt: serverTimestamp()
      });

      setSuccess("Registro exitoso. Revisa tu correo.");

    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    }
  };

  return (
    <div className="register">
      <div className="register__card">
        <div className="register__brand">
          <div className="register__logo">🐾</div>
          <h1>PetLink</h1>
          <p>Crea tu cuenta</p>
        </div>

        <form className="register__form" onSubmit={handleRegister}>
          <div className="row">
            <input name="firstName" placeholder="Nombre" onChange={handleChange} required />
            <input name="lastName" placeholder="Apellido" onChange={handleChange} required />
          </div>

          <input name="email" type="email" placeholder="Correo" onChange={handleChange} required />
          <input name="phone" placeholder="Teléfono (+569XXXXXXXX)" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required />

          <select value={form.regionId} onChange={handleRegionChange} required>
            <option value="">Región</option>
            {regions.map(r => (
              <option key={r.id} value={r.id}>{r.region}</option>
            ))}
          </select>

          <select
            name="comuna"
            value={form.comuna}
            onChange={handleChange}
            required
            disabled={!form.regionId}
          >
            <option value="">Comuna</option>
            {comunas.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input name="birthDate" type="date" onChange={handleChange} required />

          <label className="upload">
            <div className="upload__box">
              {preview ? (
                <img src={preview} alt="Preview" className="upload__preview" />
              ) : (
                <>📷 Seleccionar foto de perfil</>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleImageSelect} />
          </label>
          
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <button type="submit">Registrarse</button>
        </form>
      </div>

      {showCropper && (
        <ImageCropper
          image={imageSrc}
          aspect={1}
          onCropComplete={setCropPixels}
          onConfirm={handleConfirmCrop}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}

export default Register;
