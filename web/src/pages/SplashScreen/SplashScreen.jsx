// Masvingo Rural District Council — Splash Screen
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Shield, ArrowRight, Lock } from "lucide-react";
import "./SplashScreen.css";

const STATUS_STEPS = [
  { progress: 20, text: "Initializing Secure Vault Infrastructure..." },
  { progress: 45, text: "Verifying Cryptographic Role Tokens..." },
  { progress: 75, text: "Mounting Departmental RBAC Routing Engine..." },
  { progress: 95, text: "Enforcing Council Policy & Audit Trail..." },
  { progress: 100, text: "Secure Session Ready." },
];

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [progress, setProgress] = useState(10);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    // If auth is done loading and user is already authenticated, go directly to dashboard
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + 15;
        // update step label based on current progress
        const step = STATUS_STEPS.findIndex((s) => next <= s.progress);
        if (step !== -1) setCurrentStepIdx(step);
        else setCurrentStepIdx(STATUS_STEPS.length - 1);
        return Math.min(next, 100);
      });
    }, 320);

    return () => clearInterval(interval);
  }, [loading, user, navigate]);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        if (user) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, user, navigate]);

  const handleProceed = () => {
    if (user) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="splash-container">
      <div className="splash-bg-glow" />
      <div className="splash-grid-overlay" />

      <main className="splash-card" role="main" aria-label="MRDC System Splash">
        {/* Emblem Crest */}
        <div className="splash-crest-wrapper">
          <div className="splash-crest-halo" />
          <img
            src="/mrdc_logo.jpg"
            alt="Masvingo Rural District Council Crest"
            className="splash-crest-img"
          />
        </div>

        {/* Header Tags & Titles */}
        <div className="splash-country-tag">
          <Shield size={13} />
          <span>Republic of Zimbabwe</span>
        </div>

        <h1 className="splash-title">Masvingo Rural District Council</h1>
        <p className="splash-subtitle">E-Filing & Records Management System</p>

        <p className="splash-description">
          Official digital archiving, multi-tier document routing, and tamper-evident
          governance audit vault for MRDC departments and council authorities.
        </p>

        {/* Animated Progress Section */}
        <section className="splash-progress-section" aria-label="System Initialization">
          <div className="splash-progress-bar-bg">
            <div
              className="splash-progress-bar-fill"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div className="splash-status-text">
            <span>{STATUS_STEPS[currentStepIdx]?.text || "Ready"}</span>
            <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>
              {progress}%
            </span>
          </div>
        </section>

        {/* Direct Bypass Button */}
        <button
          type="button"
          onClick={handleProceed}
          className="splash-skip-btn"
          id="btn-splash-proceed"
        >
          <span>Enter Portal Now</span>
          <ArrowRight size={14} />
        </button>
      </main>

      <footer className="splash-footer-note">
        <Lock size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "-1px" }} />
        Restricted Government System • All transactions and queries are cryptographically logged
      </footer>
    </div>
  );
};

export default SplashScreen;
