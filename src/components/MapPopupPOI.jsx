function MapPopupPOI({ poi }) {
    const name = poi.tags?.name || "Lugar sin nombre";
  
    const typeLabel = {
      vet: "🏥 Veterinaria",
      shop: "🛒 Tienda de mascotas",
      park: "🌳 Parque"
    }[poi.type];
  
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      name
    )}@${poi.lat},${poi.lon}`;
  
    return (
      <div style={{ maxWidth: 220 }}>
        <strong>{name}</strong>
        <p>{typeLabel}</p>
  
        {typeof poi.distanceKm === "number" && (
          <p>
            📏 A{" "}
            {poi.distanceKm < 1
              ? `${Math.round(poi.distanceKm * 1000)} m`
              : `${poi.distanceKm.toFixed(1)} km`}
          </p>
        )}
  
        <a href={mapsUrl} target="_blank" rel="noreferrer">
          Abrir en Google Maps
        </a>
      </div>
    );
  }
  
  export default MapPopupPOI;
  