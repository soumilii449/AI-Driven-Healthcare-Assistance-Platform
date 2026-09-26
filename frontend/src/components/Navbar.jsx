import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  LogOut,
  Home,
  Upload,
  Moon,
  Sun,
  Siren,
  Bell,
  BookCopyIcon,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import MedicalNotificationCenter from "./MedicalNotificationCenter";
import LanguageSelector from "./LanguageSelector";

export default function Navbar() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const isAdmin =
    user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    document.body.classList.toggle(
      "dark-theme",
      darkMode
    );

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <>
      <nav className="navbar">

        <Link
          to={isAdmin ? "/admin" : "/dashboard"}
          className="nav-logo"
        >
          SwasthyaSetu
        </Link>


        <div className="nav-links">

          {!isAdmin && (
            <>
              <Link to="/dashboard">
                <Home size={18} />
                Dashboard
              </Link>

              <Link to="/upload">
                <Upload size={18} />
                Upload
              </Link>

              <Link to="/reminders">
                <Bell size={18} />
                Reminders
              </Link>

              <Link
                to="/emergency"
                className="nav-link-emergency"
              >
                <Siren size={18} />
                Emergency
              </Link>

              <Link
                to="/education"
                className="edu-page"
              >
                <BookCopyIcon size={18} />
                Health Education
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="admin-nav-link"
            >
              <ShieldCheck size={18} />
              Admin Dashboard
            </Link>
          )}

        </div>


        <div className="nav-user">

          <LanguageSelector />

          <MedicalNotificationCenter />

          <span>
            {user?.username}
          </span>

          <span className="role-badge">
            {user?.role}
          </span>

          <button
            className="theme-button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {darkMode ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

          <button
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={18} />
          </button>

        </div>


        <button
          type="button"
          className={`hamburger-button ${
            menuOpen ? "open" : ""
          }`}
          onClick={toggleMenu}
          aria-label={
            menuOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? (
            <X size={25} strokeWidth={2.2} />
          ) : (
            <Menu size={25} strokeWidth={2.2} />
          )}
        </button>

      </nav>


      <div
        id="mobile-navigation"
        className={`mobile-nav-drawer ${
          menuOpen ? "open" : ""
        }`}
        role="navigation"
        aria-label="Mobile navigation"
      >

        {!isAdmin && (
          <>
            <Link
              to="/dashboard"
              className="mobile-nav-link"
            >
              <Home size={18} />
              Dashboard
            </Link>

            <Link
              to="/upload"
              className="mobile-nav-link"
            >
              <Upload size={18} />
              Upload Prescription
            </Link>

            <Link
              to="/reminders"
              className="mobile-nav-link"
            >
              <Bell size={18} />
              Reminders
            </Link>

            <Link
              to="/emergency"
              className="mobile-nav-link mobile-nav-link--emergency"
            >
              <Siren size={18} />
              Emergency
            </Link>

            <Link
              to="/education"
              className="mobile-nav-link"
            >
              <BookCopyIcon size={18} />
              Health Education
            </Link>
          </>
        )}


        {isAdmin && (
          <Link
            to="/admin"
            className="mobile-nav-link"
          >
            <ShieldCheck size={18} />
            Admin Dashboard
          </Link>
        )}


        <div className="mobile-nav-divider" />


        <div className="mobile-language-row">

          <span>
            Language
          </span>

          <LanguageSelector />

        </div>


        <div className="mobile-nav-divider" />


        <div className="mobile-nav-user">

          <div>
            <div className="mobile-nav-username">
              {user?.username}
            </div>

            <span
              className="role-badge"
              style={{
                marginTop: 4,
                display: "inline-block",
              }}
            >
              {user?.role}
            </span>
          </div>


          <div className="mobile-theme-row">

            <span>
              {darkMode
                ? "Dark Mode"
                : "Light Mode"}
            </span>

            <button
              className="theme-button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}
            </button>

          </div>


          <button
            className="mobile-nav-logout"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={16} />
            Log Out
          </button>

        </div>

      </div>


      <style>{`

        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        /*
         * Hamburger button
         */
        .hamburger-button {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          min-width: 40px;
          padding: 0;
          margin: 0;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          flex-shrink: 0;
          z-index: 10001;
        }

        .hamburger-button svg {
          display: block;
          width: 25px;
          height: 25px;
          color: currentColor;
        }

        .hamburger-button:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        body.dark-theme .hamburger-button:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 900px) {
          .hamburger-button {
            display: flex !important;
          }
        }

        @media (max-width: 768px) {
          .hamburger-button {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }

        @media (max-width: 480px) {
          .hamburger-button {
            width: 38px;
            height: 38px;
            min-width: 38px;
          }
        }

      `}</style>
    </>
  );
}