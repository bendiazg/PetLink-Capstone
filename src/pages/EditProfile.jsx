import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import ImageCropper from "../components/ImageCropper";
import { getCroppedImage } from "../utils/imageCrop";
import "../style/EditProfile.css";

function EditProfile() {
  const navigate = useNavigate();

  const [regions, setRegions] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [imageSrc, setImageSrc] = useState(null);
  const [cropPixels, setCropPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    regionId: "",
    regionName: "",
    comuna: "",
    photoURL: ""
  });

  useEffect(() => {
    const loadRegions = async () => {
      const snap = await getDocs(collection(db, "locations"));
      setRegions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadRegions();
  }, []);

  useEffect(() => {
    if (regions.length === 0) return;

    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login", { replace: true });

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) return;

      const data = snap.data();
      const region = regions.find(r => r.region === data.location?.region);

      setForm({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        regionId: region?.id || "",
        regionName: region?.region || "",
        comuna: data.location?.comuna || "",
        photoURL: data.photoURL || ""
      });

      setComunas(region?.comunas || []);
      setLoading(false);
    };

    loadProfile();
  }, [regions, navigate]);

  const handleInput = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegionChange = (e) => {
    const region = regions.find(r => r.id === e.target.value);
    if (!region) return;

    setForm(prev => ({
      ...prev,
      regionId: region.id,
      regionName: region.region,
      comuna: ""
    }));

    setComunas(region.comunas);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageSrc(URL.createObjectURL(file));
    setShowCropper(true);
  };

  const handleSaveCroppedPhoto = async () => {
    const user = auth.currentUser;
    const blob = await getCroppedImage(imageSrc, cropPixels);

    const photoRef = ref(storage, `profilePhotos/${user.uid}`);
    await uploadBytes(photoRef, blob);
    const photoURL = await getDownloadURL(photoRef);

    setForm(prev => ({ ...prev, photoURL }));
    setShowCropper(false);
    setImageSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);
      const user = auth.currentUser;

      await updateDoc(doc(db, "users", user.uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        location: {
          region: form.regionName,
          comuna: form.comuna
        },
        photoURL: form.photoURL
      });

      navigate("/profile", { replace: true });
    } catch {
      setError("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="editProfile">
      <div className="editProfile__card">
        <h2>Editar perfil</h2>

        <div className="avatarBox">
          <img src={form.photoURL} alt="Perfil" />
          <label className="changePhoto">
            Cambiar foto
            <input type="file" accept="image/*" onChange={handleImageSelect} />
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <input name="firstName" value={form.firstName} onChange={handleInput} />
          <input name="lastName" value={form.lastName} onChange={handleInput} />
          <input name="phone" value={form.phone} onChange={handleInput} />

          <select value={form.regionId} onChange={handleRegionChange}>
            <option value="">Región</option>
            {regions.map(r => (
              <option key={r.id} value={r.id}>{r.region}</option>
            ))}
          </select>

          <select
            name="comuna"
            value={form.comuna}
            onChange={handleInput}
            disabled={!form.regionId}
          >
            <option value="">Comuna</option>
            {comunas.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>

      {showCropper && (
        <ImageCropper
          image={imageSrc}
          aspect={1}
          onCropComplete={setCropPixels}
          onConfirm={handleSaveCroppedPhoto}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}

export default EditProfile;
