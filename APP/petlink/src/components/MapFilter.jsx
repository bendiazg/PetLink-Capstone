function MapFilter({ filters, setFilters }) {

    const toggle = key =>
      setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  
    return (
      <div style={{
        position: "absolute",
        zIndex: 1000,
        top: 10,
        left: 10,
        background: "#fff",
        padding: 10,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,.2)",
        fontSize: 14
      }}>
        <strong>Filtros</strong><br />
  
        <label>
          <input
            type="checkbox"
            checked={filters.vet}
            onChange={() => toggle("vet")}
          /> Veterinarias
        </label><br />
  
        <label>
          <input
            type="checkbox"
            checked={filters.shop}
            onChange={() => toggle("shop")}
          /> Tiendas mascotas
        </label><br />
  
        <label>
          <input
            type="checkbox"
            checked={filters.park}
            onChange={() => toggle("park")}
          /> Parques
        </label>
      </div>
    );
  }
  
export default MapFilter;
  