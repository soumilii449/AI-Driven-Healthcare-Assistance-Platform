import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, Upload, X, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark-theme", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <>
      <nav className="navbar">

        <Link to="/dashboard" className="nav-logo">
          AI Healthcare
        </Link>

        <div className="nav-links">

          <Link to="/dashboard">
            <Home size={18} />
            Dashboard
          </Link>

          <Link to="/upload">
            <Upload size={18} />
            Upload
          </Link>

        </div>

        <div className="nav-user">

          <span>{user?.username}</span>

          <span className="role-badge">{user?.role}</span>

          <button
            className="theme-button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}
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
          className={`hamburger-button ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

      </nav>

      <div
        className={`mobile-nav-drawer ${menuOpen ? "open" : ""}`}
        role="navigation"
        aria-label="Mobile navigation"
      >

        <Link to="/dashboard" className="mobile-nav-link">
          <Home size={18} />
          Dashboard
        </Link>

        <Link to="/upload" className="mobile-nav-link">
          <Upload size={18} />
          Upload Prescription
        </Link>

        <div className="mobile-nav-divider" />

        <div className="mobile-nav-user">
          <div>
            <div className="mobile-nav-username">{user?.username}</div>

            <span
              className="role-badge"
              style={{ marginTop: 4, display: "inline-block" }}
            >
              {user?.role}
            </span>
          </div>

          <div className="mobile-theme-row">
            <span>{darkMode ? "Dark Mode" : "Light Mode"}</span>

            <button
              className="theme-button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
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
    </>
  );
}