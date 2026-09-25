import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Handles the PWA lifecycle:
 *  - shows a toast when the app has been cached and works offline
 *  - shows a toast + "Reload" button when a new version is available
 *  - shows an "Install app" button when the browser fires the
 *    beforeinstallprompt event (Android/desktop Chrome/Edge)
 *
 * Mount this once near the root of the app (see main.jsx).
 */
function ReloadPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for a new service worker every hour while the app is open.
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("Service worker registration failed:", error);
    },
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  };

  const showInstallButton = !!installPromptEvent && !installed;
  const showToast = offlineReady || needRefresh;

  if (!showToast && !showInstallButton) return null;

  return (
    <div style={styles.wrapper}>
      {showToast && (
        <div style={styles.toast}>
          <span style={styles.text}>
            {needRefresh
              ? "A new version of SwasthyaSetu is available."
              : "SwasthyaSetu is ready to work offline."}
          </span>
          <div style={styles.actions}>
            {needRefresh && (
              <button
                style={styles.primaryBtn}
                onClick={() => updateServiceWorker(true)}
              >
                Reload
              </button>
            )}
            <button style={styles.dismissBtn} onClick={close}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showInstallButton && (
        <button style={styles.installBtn} onClick={handleInstallClick}>
          Install SwasthyaSetu App
        </button>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    bottom: "1rem",
    left: "1rem",
    right: "1rem",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    alignItems: "flex-start",
    pointerEvents: "none",
  },
  toast: {
    background: "#2b2e28",
    color: "#f3efe4",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
    maxWidth: "420px",
    pointerEvents: "auto",
  },
  text: {
    fontSize: "0.9rem",
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
    marginLeft: "auto",
  },
  primaryBtn: {
    background: "#4a7856",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.4rem 0.8rem",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  dismissBtn: {
    background: "transparent",
    color: "#f3efe4",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "6px",
    padding: "0.4rem 0.8rem",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  installBtn: {
    background: "#4a7856",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "0.6rem 1.1rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
    cursor: "pointer",
    pointerEvents: "auto",
    alignSelf: "flex-start",
  },
};

export default ReloadPrompt;
