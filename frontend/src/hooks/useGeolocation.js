import { useCallback, useState } from "react";

// =====================================
// useGeolocation
//
// Wraps the browser Geolocation API with loading/error state so every
// emergency screen (nearby facilities, live location, ambulance, SOS)
// can request the person's position the same way.
// =====================================

export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locate = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const message = "Location isn't supported on this device/browser.";
        setError(message);
        reject(new Error(message));
        return;
      }

      setLoading(true);
      setError("");

      navigator.geolocation.getCurrentPosition(
        (result) => {
          const coords = {
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            accuracy: result.coords.accuracy,
          };

          setPosition(coords);
          setLoading(false);
          resolve(coords);
        },
        (geoError) => {
          let message = "Could not get your location.";

          if (geoError.code === geoError.PERMISSION_DENIED) {
            message =
              "Location permission was denied. Please allow location access and try again.";
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            message = "Your location is currently unavailable.";
          } else if (geoError.code === geoError.TIMEOUT) {
            message = "Getting your location took too long. Please try again.";
          }

          setError(message);
          setLoading(false);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        }
      );
    });
  }, []);

  return { position, loading, error, locate };
}
