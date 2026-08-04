import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon paths broken by Vite's asset pipeline
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom orange teardrop pin matching brand colour
const orangePin = L.divIcon({
  className: "",
  html: `
    <div style="
      position:relative;
      width:28px;height:36px;
    ">
      <div style="
        width:28px;height:28px;
        background:#f97316;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
      "></div>
    </div>`,
  iconSize:    [28, 36],
  iconAnchor:  [14, 36],
  popupAnchor: [0, -38],
});

/** Keeps the map centred when lat/lng changes */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 14); }, [lat, lng, map]);
  return null;
}

interface ListingMapProps {
  lat: number;
  lng: number;
  title: string;
  area?: string | null;
  city: string;
  state: string;
}

export function ListingMap({ lat, lng, title, area, city, state }: ListingMapProps) {
  const label = [area, city, state].filter(Boolean).join(", ");
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "220px", width: "100%", borderRadius: "1rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={lat} lng={lng} />
      <Marker position={[lat, lng]} icon={orangePin}>
        <Popup>
          <strong>{title}</strong><br />{label}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
