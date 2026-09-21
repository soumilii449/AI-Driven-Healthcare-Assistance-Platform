import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Clock } from "lucide-react";

import { getSOSLog, resolveSOS } from "../../services/api";

export default function SOSLog() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getSOSLog()
      .then((data) => setRecords(data || []))
      .catch(() =>
        setError("Could not load the SOS log. You may not have access.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveSOS(id);
      load();
    } catch {
      // No-op — the record simply stays as-is if the resolve call fails.
    }
  };

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <Link to="/emergency" className="emergency-back-link">
          <ArrowLeft size={15} /> Back to Emergency
        </Link>
        <h1>SOS Alert Log</h1>
        <p>Live and past emergency alerts triggered by users.</p>
      </div>

      {loading && <div className="emergency-loading">Loading...</div>}
      {error && <div className="emergency-error">{error}</div>}

      <div className="sos-log-list">
        {records.map((record) => (
          <div
            key={record.id}
            className={`sos-log-card ${
              record.status === "active" ? "sos-log-card--active" : ""
            }`}
          >
            <div className="sos-log-main">
              <div className="sos-log-user">
                {record.username || `User #${record.user_id}`}
                <span className={`sos-status sos-status--${record.status}`}>
                  {record.status}
                </span>
              </div>

              <p className="sos-log-coords">
                <MapPin size={14} /> {record.latitude?.toFixed(5)},{" "}
                {record.longitude?.toFixed(5)}{" "}
                <a
                  href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on map
                </a>
              </p>

              {record.note && <p className="sos-log-note">"{record.note}"</p>}

              {record.nearest_facility && (
                <p className="sos-log-hospital">
                  Nearest hospital: {record.nearest_facility.name}
                </p>
              )}

              <p className="sos-log-time">
                <Clock size={13} />{" "}
                {record.created_at
                  ? new Date(record.created_at).toLocaleString()
                  : "Unknown time"}
              </p>
            </div>

            {record.status === "active" && (
              <button
                className="emergency-secondary-button"
                onClick={() => handleResolve(record.id)}
              >
                <CheckCircle2 size={15} /> Mark resolved
              </button>
            )}
          </div>
        ))}

        {!loading && records.length === 0 && !error && (
          <div className="emergency-empty">No SOS alerts yet.</div>
        )}
      </div>
    </div>
  );
}
