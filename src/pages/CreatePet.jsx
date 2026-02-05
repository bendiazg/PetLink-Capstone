import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../services/firebase";
import "../style/CreatePet.css";

function CreatePet() {
  const navigate = useNavigate();

  const [ownerLocation, setOwnerLocation] = useState(null);
  const [ownerGeo, setOwnerGeo] = useState(null);

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

    photoFile: null
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOwnerData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setOwnerLocation(data.location || null);
        setOwnerGeo(data.geo || null);
      }
    };

    loadOwnerData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.name.trim().length < 2)
      return setError("El nombre debe tener al menos 2 caracteres.");

    if (!form.species)
      return setError("Debes seleccionar una especie.");

    if (!form.sex)
      return setError("Debes seleccionar el sexo.");

    if (Number(form.age) < 0)
      return setError("La edad no puede ser negativa.");

    if (!form.photoFile)
      return setError("Debes subir una foto.");

    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) return;

      const petRef = await addDoc(collection(db, "pets"), {
        name: form.name.trim(),
        species: form.species,
        breed: form.breed.trim(),
        age: Number(form.age),
        sex: form.sex,
        description: form.description,

        health: {
          vaccinated: form.vaccinated,
          vaccines: form.vaccines
            ? form.vaccines.split(",").map(v => v.trim())
            : [],
          sterilized: form.sterilized,
          dewormed: form.dewormed,
          notes: ""
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

        ownerId: user.uid,
        previousOwnerId: null,

        location: ownerLocation,
        geo: ownerGeo,

        isAdoptable: false,
        adopted: false,
        adoptedAt: null,

        photoURL: "",
        createdAt: serverTimestamp()
      });

      const photoRef = ref(storage, `pets/${user.uid}/${petRef.id}`);
      await uploadBytes(photoRef, form.photoFile);
      const photoURL = await getDownloadURL(photoRef);

      await updateDoc(petRef, { photoURL });

      navigate("/my-pets", { replace: true });

    } catch {
      setError("No se pudo crear la mascota.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="createPet">
      <h2>Registrar mascota</h2>

      <form onSubmit={handleSubmit}>
        <section>
          <h4>🐾 Datos básicos</h4>
          <input name="name" placeholder="Nombre" onChange={handleChange} />
          <select name="species" onChange={handleChange}>
            <option value="">Especie</option>
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
            <option value="Otro">Otro</option>
          </select>
          <input name="breed" placeholder="Raza" onChange={handleChange} />
          <input type="number" name="age" placeholder="Edad" onChange={handleChange} />
          <select name="sex" onChange={handleChange}>
            <option value="">Sexo</option>
            <option value="Macho">Macho</option>
            <option value="Hembra">Hembra</option>
          </select>
          <textarea name="description" placeholder="Descripción" onChange={handleChange} />
        </section>

        <section>
          <h4>🩺 Salud</h4>
          <label><input type="checkbox" name="vaccinated" onChange={handleChange} /> Vacunado</label>
          <input name="vaccines" placeholder="Vacunas" onChange={handleChange} />
          <label><input type="checkbox" name="sterilized" onChange={handleChange} /> Esterilizado</label>
          <label><input type="checkbox" name="dewormed" onChange={handleChange} /> Desparasitado</label>
        </section>

        <section>
          <h4>🐕 Comportamiento</h4>
          <label><input type="checkbox" name="goodWithKids" onChange={handleChange} /> Niños</label>
          <label><input type="checkbox" name="goodWithDogs" onChange={handleChange} /> Perros</label>
          <label><input type="checkbox" name="goodWithCats" onChange={handleChange} /> Gatos</label>
          <select name="energyLevel" onChange={handleChange}>
            <option value="bajo">Energía baja</option>
            <option value="medio">Energía media</option>
            <option value="alto">Energía alta</option>
          </select>
        </section>

        <section>
          <h4>🏠 Contexto</h4>
          <select name="size" onChange={handleChange}>
            <option value="pequeño">Tamaño pequeño</option>
            <option value="mediano">Tamaño mediano</option>
            <option value="grande">Tamaño grande</option>
          </select>
          <select name="livingPlace" onChange={handleChange}>
            <option value="casa">Casa</option>
            <option value="departamento">Departamento</option>
          </select>
          <label><input type="checkbox" name="specialNeeds" onChange={handleChange} /> Necesidades especiales</label>
        </section>

        <label className="upload">
          <div className="upload__box">📷 Subir foto principal</div>
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photoFile: e.target.files[0] })} />
        </label>

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar mascota"}
        </button>
      </form>
    </div>
  );
}

export default CreatePet;
