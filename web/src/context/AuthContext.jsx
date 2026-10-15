// MRDC E-Filing — Auth Context
// Provides the authenticated user's session + role to all components

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { subscribeToAuthChanges, logoutUser, DEMO_USERS } from "../services/authService";
import { isFirebaseConfigured } from "../services/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // full user profile (uid, role, dept, etc.)
  const [loading, setLoading] = useState(true);  // true while checking auth state
  const [sessionTimer, setSessionTimer] = useState(null);

  const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity

  // Reset the auto-timeout timer on any activity
  const resetSessionTimer = useCallback(() => {
    if (sessionTimer) clearTimeout(sessionTimer);
    const timer = setTimeout(async () => {
      if (user) {
        await logout();
      }
    }, SESSION_TIMEOUT_MS);
    setSessionTimer(timer);
  }, [user, sessionTimer]);

  // Attach activity listeners
  useEffect(() => {
    if (!user) return;
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetSessionTimer));
    resetSessionTimer(); // start timer on login
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetSessionTimer));
      if (sessionTimer) clearTimeout(sessionTimer);
    };
  }, [user]);

  // Initialize auth: check demo user first, otherwise Firebase auth
  useEffect(() => {
    const savedDemo = localStorage.getItem("mrdc_demo_user");
    if (savedDemo) {
      try {
        setUser(JSON.parse(savedDemo));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("mrdc_demo_user");
      }
    }

    if (isFirebaseConfigured) {
      const unsubscribe = subscribeToAuthChanges((profile) => {
        setUser(profile);
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, []);

  const loginAsDemo = (roleOrUid) => {
    const match = DEMO_USERS.find(
      (u) => u.role === roleOrUid || u.uid === roleOrUid || u.email === roleOrUid
    ) || DEMO_USERS[0];
    localStorage.setItem("mrdc_demo_user", JSON.stringify(match));
    setUser(match);
    return match;
  };

  const logout = async () => {
    if (sessionTimer) clearTimeout(sessionTimer);
    localStorage.removeItem("mrdc_demo_user");
    if (user && isFirebaseConfigured) {
      try {
        await logoutUser(user.uid, user.displayName);
      } catch (e) {
        console.warn("Logout notification error:", e);
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser, loginAsDemo, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
