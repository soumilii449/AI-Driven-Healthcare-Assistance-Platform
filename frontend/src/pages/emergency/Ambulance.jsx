import { useEffect, useState } from "react";
import { Ambulance as AmbulanceIcon, PhoneCall, MapPin, Loader2 } from "lucide-react";

import useGeolocation from "../../hooks/useGeolocation";
import {
  getEmergencyContacts,
  getNearbyFacilities,
  triggerSOS,
} from "../../services/api";

export default function Ambulance() {
  const { position, locate } = useGeolocation();

  const [contacts, setContacts] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestResult, setRequestResult] = useState(null);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    getEmergencyContacts()
      .then((data) => setContacts(data.contacts || []))
      .catch(() => {});

    locate().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!position) return;

    setLoadingHospitals(true);

    getNearbyFacilities(position.latitude, position.longitude, "ambulance")
      .then((data) => setHospitals(data.facilities || []))
      .catch(() => setHospitals([]))
      .finally(() => setLoadingHospitals(false));
  }, [position]);

  const ambulanceContacts = contacts.filter((c) =>
    c.label.toLowerCase().includes("ambulance")
  );

  const requestAmbulance = async () => {
    setRequesting(true);
    setRequestError("");
    setRequestResult(null);

    try {
      const coords = position || (await locate());
      const result = await triggerSOS(
        coords.latitude,
        coords.longitude,
        "Ambulance requested"
      );
      setRequestResult(result);
    } catch (err) {
      setRequestError(
        err?.response?.data?.detail ||
          err?.message ||
          "Could not process the request. Please call an ambulance number directly."
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="ambulance-service">
      <p className="emergency-tab-intro">
        Call for an ambulance directly, or tap below to log your location and
        find the nearest hospital that can dispatch one.
      </p>

      <div className="ambulance-numbers">
        {ambulanceContacts.map((contact) => (
          <a
            key={contact.number}
            className="ambulance-number-card"
            href={`tel:${contact.number}`}
          >
            <AmbulanceIcon size={22} />
            <div>
              <div className="ambulance-number">{contact.number}</div>
              <div className="ambulance-number-label">{contact.label}</div>
            </div>
            <PhoneCall size={18} />
          </a>
        ))}
      </div>

      <button
        className="emergency-sos-cta"
        onClick={requestAmbulance}
        disabled={requesting}
      >
        {requesting ? (
          <>
            <Loader2 size={18} className="spin" /> Locating you...
          </>
        ) : (
          <>
            <AmbulanceIcon size={18} /> Request Ambulance to My Location
          </>
        )}
      </button>

      {requestError && <div className="emergency-error">{requestError}</div>}

      {requestResult && (
        <div className="ambulance-result">
          <p>
            Your location has been logged. Call{" "}
            <a href="tel:108"><strong>108</strong></a> now and share these
            details with the dispatcher:
          </p>

          {requestResult.nearest_facility && (
            <div className="nearest-hospital-suggestion">
              <MapPin size={16} />
              <div>
                <strong>Nearest hospital:</strong>{" "}
                {requestResult.nearest_facility.name}
                {requestResult.nearest_facility.phone && (
                  <>
                    {" "}
                    ·{" "}
                    <a href={`tel:${requestResult.nearest_facility.phone}`}>
                      {requestResult.nearest_facility.phone}
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

          {requestResult.share_location && (
            <a
              className="emergency-primary-button"
              href={`https://wa.me/?text=${encodeURIComponent(
                requestResult.share_location.message
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Share my location via WhatsApp
            </a>
          )}
        </div>
      )}

      <h4 className="ambulance-hospitals-title">
        Hospitals nearby that can dispatch an ambulance
      </h4>

      {loadingHospitals && (
        <div className="emergency-loading">Finding nearby hospitals...</div>
      )}

      <div className="facility-list">
        {hospitals.map((hospital, idx) => (
          <div className="facility-card" key={idx}>
            <div className="facility-card-main">
              <h4>{hospital.name}</h4>
              {hospital.address && (
                <p className="facility-address">
                  <MapPin size={14} /> {hospital.address}
                </p>
              )}
              {hospital.distance_meters != null && (
                <span className="facility-meta">
                  {(hospital.distance_meters / 1000).toFixed(1)} km away
                </span>
              )}
            </div>

            <div className="facility-card-actions">
              {hospital.phone && (
                <a
                  className="facility-action-button facility-action-button--call"
                  href={`tel:${hospital.phone}`}
                >
                  <PhoneCall size={15} /> Call
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
