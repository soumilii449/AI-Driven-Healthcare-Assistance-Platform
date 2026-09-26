import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function getPasswordStrength(password) {
  if (!password) return null;

  const hasUpper = /[A-Z]/.test(password);
  const hasNum = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const long = password.length >= 8;

  const score = [
    password.length >= 6,
    long,
    hasUpper,
    hasNum || hasSymbol,
  ].filter(Boolean).length;

  if (score <= 1) return "weak";
  if (score <= 3) return "medium";

  return "strong";
}

function PasswordHint({ password, show }) {
  if (!show || !password) {
    return null;
  }

  const strength = getPasswordStrength(password);

  const labels = {
    weak: "Weak",
    medium: "Fair",
    strong: "Strong",
  };

  return (
    <>
      <div className="password-strength-bar">
        <div
          className={`password-strength-fill strength-${strength}`}
        />
      </div>

      <p
        className={`input-hint ${
          strength === "weak"
            ? "hint-error"
            : strength === "medium"
            ? "hint-warn"
            : "hint-ok"
        }`}
      >
        {strength === "strong" ? (
          <CheckCircle size={12} />
        ) : (
          <AlertCircle size={12} />
        )}

        {labels[strength]} password

        {strength === "weak" &&
          " — try adding numbers or symbols"}

        {strength === "medium" &&
          " — add uppercase or symbols to strengthen"}

        {strength === "strong" &&
          " — great password!"}
      </p>
    </>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const {
    login,
    register,
  } = useAuth();

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState("patient");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isRegistering, setIsRegistering] =
    useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (
      isRegistering &&
      password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await register(
          username.trim(),
          password,
          role
        );

        setMessage(
          "Registration successful. You can now login."
        );

        setIsRegistering(false);
        setPassword("");
        setRole("patient");
      } else {
        const currentUser = await login(
          username.trim(),
          password
        );

        if (!currentUser) {
          throw new Error(
            "Unable to retrieve user information."
          );
        }

        const loggedInRole =
          String(
            currentUser.role || ""
          ).toLowerCase();

        if (loggedInRole !== role) {
          setError(
            `This account is registered as ${loggedInRole}. Please select ${loggedInRole} as your role.`
          );

          return;
        }

        if (loggedInRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
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

  const switchMode = (registerMode) => {
    setIsRegistering(registerMode);
    setError("");
    setMessage("");
    setPassword("");
  };

  return (
    <div className="auth-page">

      <div className="auth-image-panel">
        <div className="auth-image-overlay">
          <h2>
            AI Healthcare Assistant
          </h2>

          <p>
            Upload or scan a prescription
            and get simple, translated,
            easy-to-understand medical
            information in seconds.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">

        <div className="auth-card">

          <h1>
            AI Healthcare Assistant
          </h1>

          <p className="auth-subtitle">
            {isRegistering
              ? "Create your account to get started"
              : "Sign in to your account"}
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
          >

            <div className="form-group">

              <label htmlFor="login-username">
                Username
              </label>

              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                placeholder="Enter your username"
                required
                autoComplete="username"
              />

            </div>

            {/* ROLE */}
            <div className="form-group">

              <label htmlFor="login-role">
                Role
              </label>

              <select
                id="login-role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value
                  )
                }
                required
              >
                <option value="patient">
                  Patient
                </option>

                <option value="doctor">
                  Doctor
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>

            </div>

            {/* PASSWORD */}
            <div className="form-group">

              <label htmlFor="login-password">
                Password
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder={
                    isRegistering
                      ? "Create a password"
                      : "Enter your password"
                  }
                  required
                  autoComplete={
                    isRegistering
                      ? "new-password"
                      : "current-password"
                  }
                  style={{
                    paddingRight: 44,
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    border: "none",
                    background: "none",
                    color: "#78786a",
                    padding: 4,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

              <PasswordHint
                password={password}
                show={isRegistering}
              />

            </div>

            {error && (
              <div
                className="error-message"
                role="alert"
              >
                <AlertCircle
                  size={15}
                  style={{
                    display: "inline",
                    marginRight: 6,
                    verticalAlign:
                      "middle",
                  }}
                />

                {error}
              </div>
            )}

            {message && (
              <div
                className="success-message"
                role="status"
              >
                <CheckCircle
                  size={15}
                  style={{
                    display: "inline",
                    marginRight: 6,
                    verticalAlign:
                      "middle",
                  }}
                />

                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="primary-button"
              style={{
                width: "100%",
                marginTop: 8,
              }}
            >

              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />

                  {isRegistering
                    ? "Creating account…"
                    : "Signing in…"}
                </>
              ) : isRegistering ? (
                "Create Account"
              ) : (
                "Sign In"
              )}

            </button>

          </form>

          <div className="auth-switch">

            {isRegistering ? (
              <>
                Already have an account?{" "}

                <button
                  type="button"
                  onClick={() =>
                    switchMode(false)
                  }
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}

                <button
                  type="button"
                  onClick={() =>
                    switchMode(true)
                  }
                >
                  Register
                </button>
              </>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}