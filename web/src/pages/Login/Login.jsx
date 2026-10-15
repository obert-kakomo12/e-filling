// Masvingo Rural District Council — Modern Split Card Login Screen
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginUser, DEMO_USERS } from "../../services/authService";
import {
  User,
  Lock,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import "./Login.css";

export const Login = () => {
  const navigate = useNavigate();
  const { setUser, loginAsDemo, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both user name (email) and password.");
      return;
    }

    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        // Live Firebase Auth
        const profile = await loginUser(email.trim(), password);
        setUser(profile);
        navigate("/dashboard", { replace: true });
      } else {
        // Offline / Developer Demo Mode
        const found = DEMO_USERS.find(
          (u) =>
            u.email.toLowerCase() === email.trim().toLowerCase() ||
            u.displayName.toLowerCase().includes(email.trim().toLowerCase())
        );

        if (found) {
          loginAsDemo(found.uid);
          navigate("/dashboard", { replace: true });
        } else {
          // Accept standard password in demo mode
          if (password.length >= 6) {
            const devProfile = {
              uid: "user-" + Date.now(),
              email: email.trim().includes("@") ? email.trim() : `${email.trim()}@mrdc.gov.zw`,
              displayName: email.split("@")[0].replace(".", " ").toUpperCase(),
              title: "Council Officer",
              role: "clerk",
              department: "ADM",
              isActive: true,
            };
            loginAsDemo(devProfile.role);
            navigate("/dashboard", { replace: true });
          } else {
            setErrorMessage("Password must be at least 6 characters.");
          }
        }
      }
    } catch (err) {
      console.error("Login failure:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setErrorMessage("Invalid council credentials. Please check your user name and password.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMessage("Access temporarily blocked due to multiple attempts. Please try again later.");
      } else {
        setErrorMessage(err.message || "An error occurred during authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoUser = (demoUser) => {
    loginAsDemo(demoUser.uid);
    setIsDemoModalOpen(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="login-page-container">
      {/* Background radial effects */}
      <div className="login-bg-decor" />
      <div className="login-bg-circle-1" />
      <div className="login-bg-circle-2" />

      {/* Main Split Card */}
      <div className="login-split-card">
        {/* Left Welcome Panel with organic curved design */}
        <section className="login-left-panel">
          <div className="welcome-bubble-1" />
          <div className="welcome-bubble-2" />

          {/* Static organic curve matching reference design */}
          <svg
            className="welcome-curve-divider"
            viewBox="0 0 50 500"
            preserveAspectRatio="none"
            fill="#ffffff"
            aria-hidden="true"
          >
            <path d="M 0,0 C 35,120 50,180 50,250 C 50,320 20,400 0,500 L 50,500 L 50,0 Z" />
          </svg>

          <div className="welcome-content">
            <div className="welcome-crest-wrap">
              <img
                src="/mrdc_logo.jpg"
                alt="MRDC Crest"
                className="welcome-crest-img"
              />
              <span className="welcome-council-badge">Masvingo RDC</span>
            </div>

            <h1 className="welcome-title">WELCOME</h1>
            <h2 className="welcome-subtitle">MRDC E-FILING PORTAL</h2>

            <p className="welcome-desc">
              Masvingo Rural District Council statutory digital records management system. Secure institutional archiving, multi-tier RBAC approval engine, and tamper-evident audit security under Chapter 29:13.
            </p>
          </div>
        </section>

        {/* Right Sign-in Form Panel */}
        <section className="login-right-panel">
          <div className="login-corner-accent" />

          <div className="login-form-container">
            <h2 className="signin-heading">Sign in</h2>
            <p className="signin-subtitle">
              Enter your official council credentials to access your workspace.
            </p>

            {errorMessage && (
              <div className="login-error-alert" role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="login-input-group">
                {/* Username Input with User Icon */}
                <div className="login-pill-field">
                  <User size={18} className="login-field-icon" />
                  <input
                    type="text"
                    className="login-pill-input"
                    placeholder="User Name"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                    id="input-login-username"
                  />
                </div>

                {/* Password Input with Lock Icon & SHOW Toggle */}
                <div className="login-pill-field">
                  <Lock size={18} className="login-field-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="login-pill-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    id="input-login-password"
                  />
                  <button
                    type="button"
                    className="login-show-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="login-options-row">
                <label className="login-remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={() =>
                    alert("Please contact Council System Administrator at sysadmin@mrdc.gov.zw to reset your password.")
                  }
                >
                  Forgot Password?
                </button>
              </div>

              {/* Primary Action Button: Sign in */}
              <button
                type="submit"
                className="btn-primary-signin"
                disabled={loading}
                id="btn-sign-in"
              >
                {loading ? "Authenticating..." : "Sign in"}
              </button>

              {/* Divider */}
              <div className="signin-divider">
                <span>Or</span>
              </div>

              {/* Secondary Action Button: Sign in with other */}
              <button
                type="button"
                className="btn-secondary-other"
                onClick={() => setIsDemoModalOpen(true)}
                id="btn-signin-with-other"
              >
                <Sparkles size={16} style={{ color: "#0066d6" }} />
                <span>Sign in with other</span>
              </button>

              {/* Footer */}
              <div className="signin-footer">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Demo Role Switcher Modal triggered by 'Sign in with other' */}
      {isDemoModalOpen && (
        <div
          className="demo-role-modal-overlay"
          onClick={() => setIsDemoModalOpen(false)}
        >
          <div
            className="demo-role-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="demo-role-modal-header">
              <h3>
                <Sparkles size={18} style={{ color: "#0066d6" }} />
                Select Council Role Persona
              </h3>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="demo-role-grid">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.uid}
                  type="button"
                  className="demo-role-btn"
                  onClick={() => handleSelectDemoUser(demo)}
                >
                  <span className="demo-role-btn-name">{demo.displayName}</span>
                  <span className="demo-role-btn-title">{demo.title}</span>
                  <span className="demo-role-btn-dept">
                    {demo.role.toUpperCase()} • Dept: {demo.department}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
