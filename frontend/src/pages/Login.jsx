import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState("patient");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isRegistering) {
        await register(username, password, role);

        setMessage(
          "Registration successful. You can now login."
        );

        setIsRegistering(false);
        setPassword("");
      } else {
        const user = await login(username, password);

        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h1>AI Healthcare Assistant</h1>

        <p className="auth-subtitle">
          {isRegistering
            ? "Create your account"
            : "Login to your account"}
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              required
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label>Role</label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
              >
                <option value="patient">
                  Patient
                </option>

                <option value="doctor">
                  Doctor
                </option>
              </select>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="primary-button"
          >
            {loading
              ? "Please wait..."
              : isRegistering
              ? "Create Account"
              : "Login"}
          </button>

        </form>

        <div className="auth-switch">

          {isRegistering ? (
            <>
              Already have an account?{" "}

              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError("");
                  setMessage("");
                }}
              >
                Login
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}

              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError("");
                  setMessage("");
                }}
              >
                Register
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
}