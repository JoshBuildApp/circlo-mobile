import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { Star, CheckCircle2, MapPin, Navigation } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Users } from "lucide-react";

/* ─── Types ─── */
interface MapCoach {
  id: string;
  name: string;
  sport: string;
  image: string;
  rating: number;
  price: number;
  isVerified: boolean;
  isPro: boolean;
  isBoosted: boolean;
  followers: number;
  location: string;
}

interface CoachMapViewProps {
  coaches: MapCoach[];
}

/* ─── Static geocoding lookup (avoids API calls) ─── */
const CITY_COORDS: Record<string, [number, number]> = {
  "los angeles": [34.0522, -118.2437],
  "chicago": [41.8781, -87.6298],
  "austin": [30.2672, -97.7431],
  "miami": [25.7617, -80.1918],
  "new york": [40.7128, -74.006],
  "san diego": [32.7157, -117.1611],
  "tel aviv": [32.0853, 34.7818],
  "jerusalem": [31.7683, 35.2137],
  "haifa": [32.794, 34.9896],
  "ramat gan": [32.0684, 34.8248],
  "herzliya": [32.1629, 34.8447],
  "netanya": [32.3215, 34.8532],
  "rishon lezion": [31.9642, 34.8045],
  "petah tikva": [32.0867, 34.8869],
  "beer sheva": [31.2518, 34.7913],
  "ashdod": [31.8044, 34.6553],
  "london": [51.5074, -0.1278],
  "paris": [48.8566, 2.3522],
  "berlin": [52.52, 13.405],
  "barcelona": [41.3874, 2.1686],
  "madrid": [40.4168, -3.7038],
  "rome": [41.9028, 12.4964],
  "amsterdam": [52.3676, 4.9041],
  "dubai": [25.2048, 55.2708],
  "toronto": [43.6532, -79.3832],
  "sydney": [-33.8688, 151.2093],
  "san francisco": [37.7749, -122.4194],
  "boston": [42.3601, -71.0589],
  "seattle": [47.6062, -122.3321],
  "denver": [39.7392, -104.9903],
  "atlanta": [33.749, -84.388],
  "dallas": [32.7767, -96.797],
  "houston": [29.7604, -95.3698],
  "phoenix": [33.4484, -112.074],
  "philadelphia": [39.9526, -75.1652],
  "las vegas": [36.1699, -115.1398],
  "portland": [45.5051, -122.675],
};

function geocodeLocation(location: string): [number, number] | null {
  if (!location) return null;
  const lower = location.toLowerCase().trim();

  // Direct match
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }

  // Try first part before comma
  const firstPart = lower.split(",")[0].trim();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (firstPart === city || city.includes(firstPart)) return coords;
  }

  return null;
}

/* ─── Custom marker icon ─── */
const createCoachIcon = (isVerified: boolean) =>
  L.divIcon({
    className: "coach-map-marker",
    html: `<div style="
      width: 36px; height: 36px; border-radius: 50%;
      background: ${isVerified ? "hsl(var(--primary))" : "hsl(var(--foreground))"};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

/* ─── Fit bounds helper ─── */
const FitBounds = ({ coords }: { coords: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 13);
    } else {
      const bounds = L.latLngBounds(coords.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [coords, map]);
  return null;
};

/* ─── Locate user button ─── */
const LocateButton = () => {
  const map = useMap();
  const handleLocate = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 13);
      },
      () => {
        // Silently fail — user denied location
      }
    );
  };
  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-4 right-4 z-[1000] h-10 w-10 rounded-full bg-background shadow-lg border border-border flex items-center justify-center active:scale-95 transition-all"
      aria-label="Center on my location"
    >
      <Navigation className="h-4 w-4 text-primary" />
    </button>
  );
};

/* ─── Main Component ─── */
const CoachMapView = ({ coaches }: CoachMapViewProps) => {
  const geocoded = useMemo(() => {
    const results: { coach: MapCoach; coords: [number, number] }[] = [];
    for (const coach of coaches) {
      const coords = geocodeLocation(coach.location);
      if (coords) results.push({ coach, coords });
    }
    return results;
  }, [coaches]);

  const allCoords = useMemo(() => geocoded.map((g) => g.coords), [geocoded]);

  // Default center: Tel Aviv or first coach
  const defaultCenter: [number, number] = allCoords.length > 0 ? allCoords[0] : [32.0853, 34.7818];

  if (coaches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <MapPin className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground mb-1">No coaches to display</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  if (geocoded.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <MapPin className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground mb-1">No locations available</h3>
          <p className="text-xs text-muted-foreground">Coaches in this view don't have mapped locations yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <MapContainer
        center={defaultCenter}
        zoom={10}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds coords={allCoords} />
        <LocateButton />
        {geocoded.map(({ coach, coords }) => (
          <Marker
            key={coach.id}
            position={coords}
            icon={createCoachIcon(coach.isVerified)}
          >
            <Popup closeButton={false} className="coach-map-popup">
              <Link
                to={`/coach/${coach.id}`}
                className="flex items-center gap-3 p-1 min-w-[200px] no-underline"
              >
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {coach.image ? (
                    <img
                      src={coach.image}
                      alt={coach.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-foreground truncate">
                      {coach.name}
                    </span>
                    {coach.isVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground capitalize">{coach.sport}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-[11px]">
                      <Star className="h-3 w-3 text-accent fill-accent" />
                      <span className="font-bold text-foreground">{coach.rating}</span>
                    </span>
                    <span className="text-[11px] font-bold text-primary">
                      ₪{coach.price}/hr
                    </span>
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Coach count badge */}
      <div className="absolute top-4 left-4 z-[1000] px-3 py-1.5 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border border-border text-xs font-bold text-foreground">
        {geocoded.length} coach{geocoded.length !== 1 ? "es" : ""} on map
      </div>
    </div>
  );
};

export default CoachMapView;
