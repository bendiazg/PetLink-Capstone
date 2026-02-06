import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, storage } from "../services/firebase";
import "../style/EditPet.css";

function EditPet() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    sex: "",
    description: "",

    vaccinated: false,
    vaccines: "",
    sterilized: false,
    dewormed: false,

    goodWithKids: false,
    goodWithDogs: false,
    goodWithCats: false,
    energyLevel: "medio",

    size: "mediano",
    livingPlace: "casa",
    specialNeeds: false,

    isAdoptable: false,

    photoFile: null,
    photoURL: "",
    galleryFiles: [],
    galleryURLs: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPet = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return navigate("/login", { replace: true });

        const snap = await getDoc(doc(db, "pets", id));
        if (!snap.exists()) {
          setError("Mascota no encontrada.");
          return;
        }

        const data = snap.data();
        if (data.ownerId !== user.uid) {
          navigate("/", { replace: true });
          return;
        }

        setForm({
          name: data.name || "",
          species: data.species || "",
          breed: data.breed || "",
          age: data.age || "",
          sex: data.sex || "",
          description: data.description || "",

          vaccinated: data.health?.vaccinated || false,
          vaccines: (data.health?.vaccines || []).join(", "),
          sterilized: data.health?.sterilized || false,
          dewormed: data.health?.dewormed || false,

          goodWithKids: data.behavior?.goodWithKids || false,
          goodWithDogs: data.behavior?.goodWithDogs || false,
          goodWithCats: data.behavior?.goodWithCats || false,
          energyLevel: data.behavior?.energyLevel || "medio",

          size: data.context?.size || "mediano",
          livingPlace: data.context?.livingPlace || "casa",
          specialNeeds: data.context?.specialNeeds || false,

          isAdoptable: data.isAdoptable || false,

          photoFile: null,
          photoURL: data.photoURL || "",
          galleryFiles: [],
          galleryURLs: data.photos || []
        });
      } catch {
        setError("No se pudo cargar la mascota.");
      } finally {
        setLoading(false);
      }
    };

    loadPet();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setForm(prev => ({ ...prev, galleryFiles: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) return;

      let photoURL = form.photoURL;
      let galleryURLs = [...form.galleryURLs];

      if (form.photoFile) {
        const mainRef = ref(storage, `pets/${user.uid}/${id}/main`);
        await uploadBytes(mainRef, form.photoFile);
        photoURL = await getDownloadURL(mainRef);
      }

      if (form.galleryFiles.length > 0) {
        galleryURLs = [];
        for (let i = 0; i < form.galleryFiles.length; i++) {
          const fileRef = ref(storage, `pets/${user.uid}/${id}/gallery_${i}`);
          await uploadBytes(fileRef, form.galleryFiles[i]);
          const url = await getDownloadURL(fileRef);
          galleryURLs.push(url);
        }
      }

      await updateDoc(doc(db, "pets", id), {
        name: form.name.trim(),
        breed: form.breed.trim(),
        age: Number(form.age),
        description: form.description,

        health: {
          vaccinated: form.vaccinated,
          vaccines: form.vaccines
            ? form.vaccines.split(",").map(v => v.trim())
            : [],
          sterilized: form.sterilized,
          dewormed: form.dewormed
        },

        behavior: {
          goodWithKids: form.goodWithKids,
          goodWithDogs: form.goodWithDogs,
          goodWithCats: form.goodWithCats,
          energyLevel: form.energyLevel
        },

        context: {
          size: form.size,
          livingPlace: form.livingPlace,
          specialNeeds: form.specialNeeds
        },

        isAdoptable: form.isAdoptable,
        photoURL,
        photos: galleryURLs
      });

      navigate("/my-pets", { replace: true });
    } catch {
      setError("No se pudieron guardar los cambios.");
    }
  };

  if (loading) return <p>Cargando mascota...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="editPet">
      <h2>Editar mascota</h2>

      <div className="editPet__photos">
        {form.photoURL && <img src={form.photoURL} alt="Principal" />}

        <div className="gallery">
          {form.galleryURLs.map((url, i) => (
            <img key={i} src={url} alt="Galería" />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} required />
        <input value={form.species} disabled />
        <input value={form.sex} disabled />
        <input name="breed" value={form.breed} onChange={handleChange} />
        <input type="number" name="age" value={form.age} onChange={handleChange} />
        <textarea name="description" value={form.description} onChange={handleChange} />

        <section>
          <h4>🏠 Adopción</h4>
          <label className="checkboxRow">
            <span>Disponible para adopción</span>
            <input
              type="checkbox"
              name="isAdoptable"
              checked={form.isAdoptable}
              onChange={handleChange}
            />
          </label>
        </section>

        <label className="upload">
          <div className="upload__box">📷 Cambiar foto principal</div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm({ ...form, photoFile: e.target.files[0] })
            }
          />
        </label>

        <label className="upload">
          <div className="upload__box">🖼️ Fotos adicionales (máx 4)</div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGallerySelect}
          />
        </label>

        {error && <p>{error}</p>}

        <button type="submit">Guardar cambios</button>
        <button type="button" onClick={() => navigate("/my-pets")}>
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default EditPet;
