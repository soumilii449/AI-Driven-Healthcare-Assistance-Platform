import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  MapPinned,
  Radio,
  Ambulance as AmbulanceIcon,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import FirstAid from "./emergency/FirstAid";
import NearbyFacilities from "./emergency/NearbyFacilities";
import LiveLocation from "./emergency/LiveLocation";
import Ambulance from "./emergency/Ambulance";

const TABS = [
  { id: "first-aid", label: "First Aid", icon: Stethoscope, Component: FirstAid },
  { id: "nearby", label: "Nearby Care", icon: MapPinned, Component: NearbyFacilities },
  { id: "location", label: "Live Location", icon: Radio, Component: LiveLocation },
  { id: "ambulance", label: "Ambulance", icon: AmbulanceIcon, Component: Ambulance },
];

export default function Emergency() {
  const [activeTab, setActiveTab] = useState("first-aid");
  const { user } = useAuth();

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component;
  const canViewSOSLog = user?.role === "admin" || user?.role === "doctor";

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <h1>Emergency Assistance</h1>
        <p>
          First aid guidance, nearby healthcare, live location sharing, and
          ambulance access — all in one place.
        </p>

        {canViewSOSLog && (
          <Link to="/emergency/sos-log" className="emergency-soslog-link">
            <ClipboardList size={15} /> View SOS Log
          </Link>
        )}
      </div>

      <div className="emergency-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`emergency-tab ${
              activeTab === id ? "emergency-tab--active" : ""
            }`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="emergency-tab-panel glass-card">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
