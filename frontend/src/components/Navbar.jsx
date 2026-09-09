import { Link, useNavigate } from "react-router-dom";
import { LogOut, Home, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
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

        <span>
          {user?.username}
        </span>

        <span className="role-badge">
          {user?.role}
        </span>

        <button onClick={handleLogout}>
          <LogOut size={18} />
        </button>

      </div>

    </nav>
  );
}