// =====================================
// loadGoogleMaps
//
// Loads the Google Maps JavaScript API script tag exactly once and
// resolves with the `google.maps` namespace. Uses the browser-restricted
// key from VITE_GOOGLE_MAPS_API_KEY — this key should be restricted (in
// Google Cloud Console) to the Maps JavaScript API + your site's domain,
// since it's visible in the frontend bundle.
// =====================================

let loadPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error(
        "VITE_GOOGLE_MAPS_API_KEY is not set. Add it to frontend/.env to show the map."
      )
    );
  }

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = "__initGoogleMaps";

    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&loading=async`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Maps."));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
