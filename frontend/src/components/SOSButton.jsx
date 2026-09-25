import { useState } from "react";
import {
  Siren,
  X,
  PhoneCall,
  Share2,
  Loader2,
  MapPin,
  MessageCircle,
} from "lucide-react";

import { triggerSOS, sendSOSWhatsApp } from "../services/api";

export default function SOSButton() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState("idle");
  const [whatsappError, setWhatsappError] = useState("");

  const reset = () => {
    setOpen(false);
    setStatus("idle");
    setResult(null);
    setError("");
    setWhatsappStatus("idle");
    setWhatsappError("");
  };

  const handleConfirm = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("Location isn't supported on this device/browser.");
      return;
    }

    setStatus("working");
    setError("");
    setWhatsappStatus("idle");
    setWhatsappError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await triggerSOS(
            position.coords.latitude,
            position.coords.longitude,
            "SOS triggered from quick-access button",
            contactPhone
          );

          setResult(data);
          setStatus("done");
        } catch (err) {
          setError(
            err?.response?.data?.detail || "Could not send the SOS alert."
          );
          setStatus("error");
        }
      },
      () => {
        setError("Location permission is needed to send an SOS alert.");
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleWhatsAppSOS = async () => {
    if (!contactPhone.trim()) {
      setWhatsappStatus("error");
      setWhatsappError("Please enter an emergency contact phone number first.");
      return;
    }

    setWhatsappStatus("working");
    setWhatsappError("");

    try {
      await sendSOSWhatsApp(contactPhone);
      setWhatsappStatus("done");
    } catch (err) {
      setWhatsappStatus("error");
      setWhatsappError(
        err?.response?.data?.detail ||
          "Could not send the WhatsApp SOS alert."
      );
    }
  };

  if (!open) {
    return (
      <button
        className="sos-floating-button"
        onClick={() => {
          setOpen(true);
          setStatus("confirming");
        }}
        aria-label="Emergency SOS"
        title="Emergency SOS"
      >
        <Siren size={24} />
      </button>
    );
  }

  return (
    <div className="sos-overlay" role="dialog" aria-label="Emergency SOS">
      <div className="sos-modal">
        <button className="sos-modal-close" onClick={reset} aria-label="Close">
          <X size={18} />
        </button>

        {status === "confirming" && (
          <>
            <Siren size={32} className="sos-modal-icon" />
            <h3>Send an SOS alert?</h3>
            <p>
              This will share your current location with our care team and
              show you the nearest hospital right away.
            </p>

            <input
              type="tel"
              className="live-location-note"
              placeholder="Emergency contact's phone (e.g. +9198XXXXXXXX)"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />

            <button className="emergency-sos-cta" onClick={handleConfirm}>
              Yes, send SOS now
            </button>

            <a className="emergency-secondary-button" href="tel:112">
              <PhoneCall size={15} /> Or call 112 directly
            </a>
          </>
        )}

        {status === "working" && (
          <>
            <Loader2 size={28} className="spin sos-modal-icon" />
            <p>Getting your location and sending the alert...</p>
          </>
        )}

        {status === "error" && (
          <>
            <h3>Something went wrong</h3>
            <p className="emergency-error">{error}</p>
            <a className="emergency-primary-button" href="tel:112">
              <PhoneCall size={15} /> Call 112 now instead
            </a>
          </>
        )}

        {status === "done" && result && (
          <>
            <h3>Alert sent</h3>
            <p>Your location has been logged. Call an ambulance now:</p>

            <a className="emergency-sos-cta" href="tel:108">
              <PhoneCall size={16} /> Call 108
            </a>

            <div className="sos-action-group">
              <button
                type="button"
                className="emergency-primary-button"
                onClick={handleWhatsAppSOS}
                disabled={whatsappStatus === "working"}
              >
                {whatsappStatus === "working" ? (
                  <>
                    <Loader2 size={15} className="spin" /> Sending SOS via WhatsApp...
                  </>
                ) : (
                  <>
                    <MessageCircle size={15} /> Send SOS via WhatsApp
                  </>
                )}
              </button>

              {whatsappStatus === "done" && (
                <p className="live-location-accuracy">
                  WhatsApp SOS alert sent to your emergency contact.
                </p>
              )}

              {whatsappStatus === "error" && (
                <p className="emergency-error">{whatsappError}</p>
              )}
            </div>

            {result.nearest_facility && (
              <div className="nearest-hospital-suggestion">
                <MapPin size={16} />
                <div>
                  <strong>Nearest hospital:</strong>{" "}
                  {result.nearest_facility.name}
                  {result.nearest_facility.phone && (
                    <>
                      {" "}
                      ·{" "}
                      <a href={`tel:${result.nearest_facility.phone}`}>
                        {result.nearest_facility.phone}
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}

            {result.share_location && (
              <a
                className="emergency-primary-button"
                href={`https://wa.me/?text=${encodeURIComponent(
                  result.share_location.message
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Share2 size={15} /> Share my location via WhatsApp
              </a>
            )}

            {result.sms_status?.sid && (
              <p className="live-location-accuracy">
                Text sent to your emergency contact.
              </p>
            )}

            {result.sms_status?.error && (
              <p className="emergency-error">
                SMS not sent: {result.sms_status.error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
