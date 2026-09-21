import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  RefreshCw,
  Share2,
  Navigation2,
  Hospital,
  Radio,
} from "lucide-react";

import { getNearbyFacilities } from "../../services/api";
import { loadGoogleMaps } from "../../utils/loadGoogleMaps";

export default function LiveLocation() {
  const [position, setPosition] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState("");
  const [nearestHospital, setNearestHospital] = useState(null);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  const applyPosition = (coords) => {
    setPosition(coords);
  };

  const getOnce = () => {
    if (!navigator.geolocation) {
      setError("Location isn't supported on this device/browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (result) => {
        applyPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
        });
        setError("");
      },
      () => setError("Could not get your location. Please allow location access."),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    getOnce();
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTracking = () => {
    if (tracking) {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setTracking(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (result) => {
        applyPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
        });
      },
      () => setError("Live tracking was interrupted. Please try again."),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    setTracking(true);
  };

  // Fetch nearest hospital whenever the position updates.
  useEffect(() => {
    if (!position) return;

    getNearbyFacilities(position.latitude, position.longitude, "hospital")
      .then((data) => setNearestHospital(data.facilities?.[0] || null))
      .catch(() => setNearestHospital(null));
  }, [position]);

  // Keep the map centered on the live position.
  useEffect(() => {
    if (!position || !mapRef.current) return;

    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return;

        if (!mapInstance.current) {
          mapInstance.current = new maps.Map(mapRef.current, {
            center: { lat: position.latitude, lng: position.longitude },
            zoom: 15,
            mapId: "EMERGENCY_LIVE_MAP",
          });
        } else {
          mapInstance.current.setCenter({
            lat: position.latitude,
            lng: position.longitude,
          });
        }

        if (markerRef.current) {
          markerRef.current.setPosition({
            lat: position.latitude,
            lng: position.longitude,
          });
        } else {
          markerRef.current = new maps.Marker({
            position: { lat: position.latitude, lng: position.longitude },
            map: mapInstance.current,
            title: "Your live location",
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [position]);

  const mapsLink = position
    ? `https://www.google.com/maps?q=${position.latitude},${position.longitude}`
    : "";

  const shareMessage = position
    ? `EMERGENCY - I need help. This is my current location: ${mapsLink}${
        note ? `\nNote: ${note}` : ""
      }`
    : "";

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail without HTTPS/permissions — ignore silently,
      // the WhatsApp/SMS buttons still work.
    }
  };

  return (
    <div className="live-location">
      <p className="emergency-tab-intro">
        Track exactly where you are and share it instantly with someone who
        can help.
      </p>

      <div className="live-location-controls">
        <button className="emergency-secondary-button" onClick={getOnce}>
          <RefreshCw size={15} /> Refresh location
        </button>

        <button
          className={`emergency-secondary-button ${
            tracking ? "emergency-secondary-button--active" : ""
          }`}
          onClick={toggleTracking}
        >
          <Radio size={15} /> {tracking ? "Stop live tracking" : "Start live tracking"}
        </button>
      </div>

      {error && <div className="emergency-error">{error}</div>}

      <div className="gmap-container gmap-container--tall" ref={mapRef}>
        {!position && <div className="gmap-placeholder">Locating you...</div>}
      </div>

      {position && (
        <div className="live-location-details">
          <p>
            <MapPin size={14} /> {position.latitude.toFixed(5)},{" "}
            {position.longitude.toFixed(5)}
            {position.accuracy && (
              <span className="live-location-accuracy">
                {" "}
                (± {Math.round(position.accuracy)} m)
              </span>
            )}
          </p>

          {nearestHospital && (
            <div className="nearest-hospital-suggestion">
              <Hospital size={16} />
              <div>
                <strong>Nearest hospital:</strong> {nearestHospital.name}
                {nearestHospital.distance_meters != null && (
                  <> · {(nearestHospital.distance_meters / 1000).toFixed(1)} km away</>
                )}
                {nearestHospital.maps_url && (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={nearestHospital.maps_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation2 size={13} style={{ verticalAlign: "-2px" }} /> Directions
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

          <label className="live-location-note-label">
            Optional note (what happened, symptoms, etc.)
            <textarea
              className="live-location-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Fell off a bike, leg injury"
            />
          </label>

          <div className="share-location-actions">
            <a
              className="emergency-primary-button"
              href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Share2 size={16} /> Share via WhatsApp
            </a>

            <a
              className="emergency-secondary-button"
              href={`sms:?body=${encodeURIComponent(shareMessage)}`}
            >
              Share via SMS
            </a>

            <button className="emergency-secondary-button" onClick={copyMessage}>
              {copied ? "Copied!" : "Copy message"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
