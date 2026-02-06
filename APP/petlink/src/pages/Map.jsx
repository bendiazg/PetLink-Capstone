import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../style/Map.css";

import MapPopupPOI from "../components/MapPopupPOI";

const icons = {
  user: new L.DivIcon({
    html: "📍",
    className: "map-icon",
    iconSize: [28, 28]
  }),
  vet: new L.DivIcon({
    html: "🏥",
    className: "map-icon",
    iconSize: [26, 26]
  }),
  shop: new L.DivIcon({
    html: "🛒",
    className: "map-icon",
    iconSize: [26, 26]
  }),
  park: new L.DivIcon({
    html: "🌳",
    className: "map-icon",
    iconSize: [26, 26]
  })
};

function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function MapController({ onReady, onMove }) {
  const map = useMap();

  useEffect(() => {
    if (map) onReady(map);
  }, [map, onReady]);

  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onMove([c.lat, c.lng]);
    }
  });

  return null;
}

export default function Map() {
  const [mapInstance, setMapInstance] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [pois, setPois] = useState([]);

  const [filters, setFilters] = useState({
    vet: true,
    shop: true,
    park: true
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
      },
      () => {
        alert("No se pudo obtener tu ubicación");
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const loadPOI = async (lat, lng) => {
    const query = `
      [out:json];
      (
        node["amenity"="veterinary"](around:6000,${lat},${lng});
        node["shop"="pet"](around:6000,${lat},${lng});
        node["leisure"="park"](around:6000,${lat},${lng});
      );
      out body;
    `;

    const res = await fetch(
      "https://overpass-api.de/api/interpreter",
      { method: "POST", body: query }
    );

    const data = await res.json();

    const parsed = (data.elements || [])
      .map(p => {
        let type = null;
        if (p.tags?.amenity === "veterinary") type = "vet";
        if (p.tags?.shop === "pet") type = "shop";
        if (p.tags?.leisure === "park") type = "park";
        if (!type) return null;

        return {
          ...p,
          lat: p.lat,
          lon: p.lon,
          type,
          distanceKm:
            userPos && distanceKm(userPos, [p.lat, p.lon])
        };
      })
      .filter(Boolean);

    setPois(parsed);
  };

  const goToMyLocation = () => {
    if (!mapInstance || !userPos) return;

    mapInstance.flyTo(userPos, 15, {
      animate: true,
      duration: 1.2
    });
  };

  return (
    <div className="map-wrapper">

      <div className="map-filters">
        {["vet", "shop", "park"].map(t => (
          <label key={t}>
            <input
              type="checkbox"
              checked={filters[t]}
              onChange={() =>
                setFilters(f => ({ ...f, [t]: !f[t] }))
              }
            />
            {t === "vet" && " Veterinarias"}
            {t === "shop" && " Tiendas"}
            {t === "park" && " Parques"}
          </label>
        ))}
      </div>
      <button
        className="map-my-location"
        onClick={goToMyLocation}
        disabled={!userPos}
        title="Mi ubicación"
      >
        📍
      </button>

      <MapContainer
        center={[-33.45, -70.66]}
        zoom={14}
        className="map-container"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController
          onReady={setMapInstance}
          onMove={(c) => loadPOI(c[0], c[1])}
        />

        {userPos && (
          <Marker position={userPos} icon={icons.user}>
            <Popup>Tu ubicación</Popup>
          </Marker>
        )}

        {pois.map(p => {
          if (!filters[p.type]) return null;

          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lon]}
              icon={icons[p.type]}
            >
              <Popup>
                <MapPopupPOI poi={p} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
