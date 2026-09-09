import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return null;
  const hasUpper  = /[A-Z]/.test(pw);
  const hasNum    = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const long      = pw.length >= 8;

  const score = [pw.length >= 6, long, hasUpper, hasNum || hasSymbol].filter(Boolean).length;
  if (score <= 1) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

function PasswordHint({ password, show }) {
  if (!show || !password) return null;
  const strength = getPasswordStrength(password);

  const labels = { weak: "Weak", medium: "Fair", strong: "Strong" };
  const hints  = { weak: "hint-error", medium: "hint-warn", strong: "hint-ok" };
  const icons  = {
    weak:   <AlertCircle size={12} />,
    medium: <AlertCircle size={12} />,
    strong: <CheckCircle size={12} />,
  };

  return (
    <>
      <div className="password-strength-bar">
        <div className={`password-strength-fill strength-${strength}`} />
      </div>
      <p className={`input-hint ${hints[strength]}`}>
        {icons[strength]}
        {labels[strength]} password
        {strength === "weak"   && " — try adding numbers or symbols"}
        {strength === "medium" && " — add uppercase or symbols to strengthen"}
        {strength === "strong" && " — great password!"}
      </p>
    </>
  );
}

// ── Component ─────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState("patient");

  const [error, setError]     = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Prevent errors — inline pre-validation (Principle 10)
    if (isRegistering && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await register(username, password, role);
        setMessage("Registration successful. You can now login.");
        setIsRegistering(false);
        setPassword("");
      } else {
        await login(username, password);
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

  const switchMode = (toRegister) => {
    setIsRegistering(toRegister);
    setError("");
    setMessage("");
    setPassword("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Title — Hierarchy: h1 is the single biggest element */}
        <h1>AI Healthcare Assistant</h1>

        <p className="auth-subtitle">
          {isRegistering
            ? "Create your account to get started"
            : "Sign in to your account"}
        </p>

        <form onSubmit={handleSubmit} noValidate>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              aria-required="true"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegistering ? "Create a password" : "Enter your password"}
                required
                autoComplete={isRegistering ? "new-password" : "current-password"}
                aria-required="true"
                style={{ paddingRight: 44 }}
              />
              {/* Show/hide toggle (Prevent Errors — don't let users mistype) */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  color: "#64748b",
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength — only during registration */}
            <PasswordHint password={password} show={isRegistering} />
          </div>

          {/* Role — only during registration */}
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="login-role">Role</label>
              <select
                id="login-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Select your role"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
          )}

          {/* Error feedback — Color with purpose: red = error */}
          {error && (
            <div className="error-message" role="alert" aria-live="polite">
              <AlertCircle size={15} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              {error}
            </div>
          )}

          {/* Success feedback — green = success */}
          {message && (
            <div className="success-message" role="status" aria-live="polite">
              <CheckCircle size={15} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              {message}
            </div>
          )}

          {/* Submit — animated loading state (Feedback: Principle 7) */}
          <button
            type="submit"
            disabled={loading}
            className="primary-button"
            style={{ width: "100%", marginTop: 8 }}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 size={17} className="spin" />
                {isRegistering ? "Creating account…" : "Signing in…"}
              </>
            ) : isRegistering ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>

        </form>

        {/* Switch mode */}
        <div className="auth-switch">
          {isRegistering ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode(false)}>
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button type="button" onClick={() => switchMode(true)}>
                Register
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}