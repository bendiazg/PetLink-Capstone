import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import "../style/PetSearch.css";

function PetSearch() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [userGeo, setUserGeo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    species: "",
    sex: "",
    vaccinated: false,
    sterilized: false,
    minAge: "",
    maxAge: ""
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getUserGeo = () =>
    new Promise(resolve => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 8000 }
      );
    });

  useEffect(() => {
    getUserGeo().then(setUserGeo);
  }, []);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "pets"),
          where("isAdoptable", "==", true),
          where("adopted", "==", false)
        );

        const snap = await getDocs(q);
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.ownerId !== user.uid);

        setPets(data);
        setFilteredPets(data);
      } catch {
        setError("No se pudieron cargar las mascotas.");
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  const distance = (a, b) => {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * Math.PI / 180) *
      Math.cos(b.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  useEffect(() => {
    let result = [...pets];

    if (filters.search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.species) {
      result = result.filter(p => p.species === filters.species);
    }

    if (filters.sex) {
      result = result.filter(p => p.sex === filters.sex);
    }

    if (filters.vaccinated) {
      result = result.filter(p => p.health?.vaccinated);
    }

    if (filters.sterilized) {
      result = result.filter(p => p.health?.sterilized);
    }

    if (filters.minAge !== "") {
      result = result.filter(p => Number(p.age) >= Number(filters.minAge));
    }

    if (filters.maxAge !== "") {
      result = result.filter(p => Number(p.age) <= Number(filters.maxAge));
    }

    if (userGeo) {
      result.sort((a, b) => {
        if (!a.geo || !b.geo) return 0;
        return distance(userGeo, a.geo) - distance(userGeo, b.geo);
      });
    }

    setFilteredPets(result);
  }, [filters, pets, userGeo]);

  if (loading) return <p className="search__loading">Cargando mascotas…</p>;
  if (error) return <p className="search__error">{error}</p>;

  return (
    <div className="search">
      <header className="search__header">
        <h1>Buscar mascotas</h1>
        <button onClick={() => setShowFilters(!showFilters)}>
          🔍 Filtros
        </button>
      </header>

      <input
        className="search__input"
        placeholder="Buscar por nombre"
        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
      />

      {showFilters && (
        <div className="filters">
          <select onChange={e => setFilters(f => ({ ...f, species: e.target.value }))}>
            <option value="">Todas las especies</option>
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
          </select>

          <select onChange={e => setFilters(f => ({ ...f, sex: e.target.value }))}>
            <option value="">Ambos sexos</option>
            <option value="Macho">Macho</option>
            <option value="Hembra">Hembra</option>
          </select>

          <div className="ageRow">
            <input type="number" placeholder="Edad mín" onChange={e => setFilters(f => ({ ...f, minAge: e.target.value }))} />
            <input type="number" placeholder="Edad máx" onChange={e => setFilters(f => ({ ...f, maxAge: e.target.value }))} />
          </div>

          <label>
            Vacunado
            <input type="checkbox" onChange={e => setFilters(f => ({ ...f, vaccinated: e.target.checked }))} />
          </label>

          <label>
            Esterilizado
            <input type="checkbox" onChange={e => setFilters(f => ({ ...f, sterilized: e.target.checked }))} />
          </label>

          <button
            className="clear"
            onClick={() =>
              setFilters({
                search: "",
                species: "",
                sex: "",
                vaccinated: false,
                sterilized: false,
                minAge: "",
                maxAge: ""
              })
            }
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {filteredPets.length === 0 && (
        <p className="search__empty">No se encontraron mascotas.</p>
      )}

      <div className="search__grid">
        {filteredPets.map(pet => (
          <div
            key={pet.id}
            className="petCard"
            onClick={() => navigate(`/pets/${pet.id}`)}
          >
            <img src={pet.photoURL} alt={pet.name} />
            <div className="petCard__info">
              <h3>{pet.name}</h3>
              <p>{pet.species} · {pet.age} años</p>
              <span>📍 {pet.location?.comuna}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PetSearch;
