import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Languages,
  Upload,
  ArrowRight,
  Camera,
  Volume2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const features = [
  {
    icon: Upload,
    title: "Upload or Scan",
    description: "Upload a prescription image or capture one directly with your camera.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Analysis",
    description: "Our AI extracts and simplifies complex medical information automatically.",
  },
  {
    icon: Languages,
    title: "Multi-Language Support",
    description: "Get your results translated into Hindi, Bengali, Tamil, and more.",
  },
  {
    icon: Volume2,
    title: "Listen to Your Results",
    description: "Text-to-speech reads your treatment information aloud, in your language.",
  },
];

export default function Landing() {
  const { user, loading } = useAuth();

  return (
    <div className="landing-page">

      <div className="landing-hero">

        <nav className="landing-nav">
          <div className="landing-logo">SwasthyaSetu</div>

          {!loading && (
            user ? (
              <Link to="/dashboard" className="landing-nav-button">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/login" className="landing-nav-button">
                Login
              </Link>
            )
          )}
        </nav>

        <div className="landing-hero-content">

          <div className="landing-badge">
            <Sparkles size={15} />
            AI-Powered Healthcare Assistant
          </div>

          <h1>
            Understand Your Prescription
            <span> in Seconds</span>
          </h1>

          <p>
            Upload or scan a prescription and let AI turn confusing
            medical jargon into clear, simple information — translated
            into your language, and read aloud if you need it.
          </p>

          <div className="landing-hero-actions">

            <Link
              to={user ? "/dashboard" : "/login"}
              className="landing-primary-button"
            >
              {user ? "Go to Dashboard" : "Get Started"}
              <ArrowRight size={18} />
            </Link>

            <Link to="/login" className="landing-secondary-button">
              {user ? "Switch Account" : "I already have an account"}
            </Link>

          </div>

          <div className="landing-trust-row">
            <div className="landing-trust-item">
              <ShieldCheck size={16} />
              Privacy focused
            </div>
            <div className="landing-trust-item">
              <Camera size={16} />
              Camera & upload support
            </div>
          </div>

        </div>

      </div>

      <section className="landing-features">

        <div className="landing-section-heading">
          <span>HOW IT HELPS</span>
          <h2>Everything you need, in one place</h2>
        </div>

        <div className="landing-features-grid">

          {features.map(({ icon: Icon, title, description }) => (
            <div className="landing-feature-card" key={title}>
              <div className="landing-feature-icon">
                <Icon size={24} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}

        </div>

      </section>

      <footer className="landing-footer">
        <p>
          Information provided is for understanding purposes only
          and should not replace advice from a qualified healthcare professional.
        </p>
      </footer>

    </div>
  );
}