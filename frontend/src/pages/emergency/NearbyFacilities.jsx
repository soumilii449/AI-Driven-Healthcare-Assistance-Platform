import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Phone,
  Navigation,
  RefreshCw,
  Star,
  Hospital,
  Pill,
  Stethoscope,
} from "lucide-react";

import useGeolocation from "../../hooks/useGeolocation";
import { getNearbyFacilities } from "../../services/api";
import { loadGoogleMaps } from "../../utils/loadGoogleMaps";

const FACILITY_TYPES = [
  { id: "hospital", label: "Hospitals", icon: Hospital },
  { id: "clinic", label: "Clinics", icon: Stethoscope },
  { id: "pharmacy", label: "Pharmacies", icon: Pill },
];

export default function NearbyFacilities() {
  const { position, loading: locating, error: geoError, locate } =
    useGeolocation();

  const [facilityType, setFacilityType] = useState("hospital");
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapError, setMapError] = useState("");

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Get the person's location as soon as the tab opens.
  useEffect(() => {
    locate().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async (type = facilityType) => {
    if (!position) return;

    setLoading(true);
    setError("");

    try {
      const data = await getNearbyFacilities(
        position.latitude,
        position.longitude,
        type
      );
      setFacilities(data.facilities || []);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not load nearby facilities. Please try again."
      );
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (position) {
      search(facilityType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const handleTypeChange = (type) => {
    setFacilityType(type);
    search(type);
  };

  // Render / update the map whenever the position or facility list changes.
  useEffect(() => {
    if (!position || !mapRef.current) return;

    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return;

        if (!mapInstance.current) {
          mapInstance.current = new maps.Map(mapRef.current, {
            center: { lat: position.latitude, lng: position.longitude },
            zoom: 13,
            mapId: "EMERGENCY_MAP",
          });
        } else {
          mapInstance.current.setCenter({
            lat: position.latitude,
            lng: position.longitude,
          });
        }

        // Clear old markers.
        markersRef.current.forEach((marker) => (marker.map = null));
        markersRef.current = [];

        new maps.Marker({
          position: { lat: position.latitude, lng: position.longitude },
          map: mapInstance.current,
          title: "You are here",
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4a7856",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        facilities.forEach((facility) => {
          if (facility.latitude == null || facility.longitude == null) return;

          const marker = new maps.Marker({
            position: { lat: facility.latitude, lng: facility.longitude },
            map: mapInstance.current,
            title: facility.name,
          });

          const info = new maps.InfoWindow({
            content: `<strong>${facility.name}</strong><br/>${facility.address || ""}`,
          });

          marker.addListener("click", () => {
            info.open(mapInstance.current, marker);
          });

          markersRef.current.push(marker);
        });
      })
      .catch((err) => {
        if (!cancelled) setMapError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [position, facilities]);

  return (
    <div className="nearby-facilities">
      <p className="emergency-tab-intro">
        Find the closest hospitals, clinics, and pharmacies, with directions
        and phone numbers.
      </p>

      <div className="facility-type-tabs">
        {FACILITY_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`facility-type-tab ${
              facilityType === id ? "facility-type-tab--active" : ""
            }`}
            onClick={() => handleTypeChange(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}

        <button
          className="facility-refresh-button"
          onClick={() => locate().then(() => search())}
          disabled={locating || loading}
          title="Refresh my location"
        >
          <RefreshCw size={16} className={locating ? "spin" : ""} />
        </button>
      </div>

      {geoError && <div className="emergency-error">{geoError}</div>}

      <div className="gmap-container" ref={mapRef}>
        {!position && !geoError && (
          <div className="gmap-placeholder">
            Getting your location...
          </div>
        )}
        {mapError && <div className="gmap-placeholder">{mapError}</div>}
      </div>

      {loading && <div className="emergency-loading">Searching nearby...</div>}
      {error && <div className="emergency-error">{error}</div>}

      {!loading && !error && facilities.length === 0 && position && (
        <div className="emergency-empty">
          No facilities found nearby. Try a different category or check back
          later.
        </div>
      )}

      <div className="facility-list">
        {facilities.map((facility, idx) => (
          <div className="facility-card" key={idx}>
            <div className="facility-card-main">
              <h4>{facility.name}</h4>
              {facility.address && (
                <p className="facility-address">
                  <MapPin size={14} /> {facility.address}
                </p>
              )}
              <div className="facility-meta">
                {facility.distance_meters != null && (
                  <span>
                    {(facility.distance_meters / 1000).toFixed(1)} km away
                  </span>
                )}
                {facility.rating && (
                  <span>
                    <Star size={13} /> {facility.rating}
                  </span>
                )}
                {facility.open_now != null && (
                  <span
                    className={
                      facility.open_now
                        ? "facility-open"
                        : "facility-closed"
                    }
                  >
                    {facility.open_now ? "Open now" : "Closed"}
                  </span>
                )}
              </div>
            </div>

            <div className="facility-card-actions">
              {facility.phone && (
                <a
                  className="facility-action-button facility-action-button--call"
                  href={`tel:${facility.phone}`}
                >
                  <Phone size={15} /> Call
                </a>
              )}
              {facility.maps_url && (
                <a
                  className="facility-action-button"
                  href={facility.maps_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={15} /> Directions
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
