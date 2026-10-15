import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DEPARTMENTS, ROLES } from "../../utils/rbac";
import { DEMO_USERS } from "../../services/authService";
import NotificationBell from "../NotificationBell/NotificationBell";
import Badge from "../Badge/Badge";
import {
  Menu,
  Search,
  X,
  Clock,
  ChevronDown,
  LogOut,
  Sparkles,
  Shield,
} from "lucide-react";
import "./Topbar.css";

const PAGE_TITLES = {
  "/dashboard": "Executive Dashboard",
  "/upload": "Document Upload Room",
  "/vault": "Official Document Vault",
  "/archive": "Fiscal Year Archive Vault",
  "/audit-log": "Cryptographic Audit Trail",
  "/admin": "Council Administration Console",
  "/councilor": "Councilor Legislative Portal",
  "/routing": "Document Routing Engine & Matrix",
  "/approvals": "Executive Clearance & Approval Queue",
};

export const Topbar = ({ onToggleMobileSidebar }) => {
  const { user, logout, loginAsDemo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 minutes (300s)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Inactivity countdown: 5 minutes = 300 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Reset countdown timer on user interaction
    const handleActivity = () => {
      setSecondsRemaining(300);
    };

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, handleActivity));

    return () => {
      clearInterval(timer);
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, []);

  // Dismiss dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/vault?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentPageTitle = PAGE_TITLES[location.pathname] || "MRDC Portal";
  const deptInfo = DEPARTMENTS[user?.department] || { code: user?.department || "ADM", name: "Masvingo RDC" };

  const getInitials = (name) => {
    if (!name) return "CO";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="mrdc-topbar">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="topbar-breadcrumbs">
          <span className="topbar-council-tag">
            Masvingo RDC • {deptInfo.code}
          </span>
          <h1 className="topbar-page-title">{currentPageTitle}</h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="topbar-center">
        <form className="topbar-search-form" onSubmit={handleSearchSubmit}>
          <Search className="topbar-search-icon" size={16} />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search by Ref (MRDC/...), title, or metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="input-topbar-search"
          />
          {searchQuery && (
            <button
              type="button"
              className="topbar-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Right: Security Timer, Notification Bell, User Menu */}
      <div className="topbar-right">
        {/* 5-minute inactivity session countdown */}
        <div
          className="topbar-session-timer"
          title="Auto-timeout session timer resets on any activity"
        >
          <span
            className={`topbar-session-dot ${secondsRemaining < 60 ? "warning" : ""}`}
          />
          <Clock size={13} />
          <span>{formatCountdown(secondsRemaining)}</span>
        </div>

        {/* In-app Notification Bell */}
        <NotificationBell />

        {/* User Profile & Role Selector Dropdown */}
        <div className="topbar-user-wrap" ref={userMenuRef}>
          <button
            type="button"
            className="topbar-user-btn"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-expanded={isUserMenuOpen}
            aria-label="User Account Menu"
          >
            <div className="topbar-user-avatar">
              {getInitials(user?.displayName)}
            </div>
            <div className="topbar-user-details">
              <span className="topbar-user-name">{user?.displayName}</span>
              <span className="topbar-user-role">{user?.role?.toUpperCase()}</span>
            </div>
            <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />
          </button>

          {isUserMenuOpen && (
            <div className="topbar-user-menu" role="menu">
              <div className="topbar-menu-header">
                <div className="topbar-menu-header-name">{user?.displayName}</div>
                <div className="topbar-menu-header-email">{user?.email}</div>
                <div style={{ marginTop: "0.4rem" }}>
                  <Badge type="role" value={user?.role} />
                </div>
              </div>

              {/* Role Switcher Drawer */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                  Switch Test Role
                </span>
                <select
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(201,162,39,0.3)",
                    color: "#ffffff",
                    padding: "0.45rem",
                    borderRadius: "6px",
                    fontSize: "0.78rem"
                  }}
                  value={user?.role}
                  onChange={(e) => {
                    loginAsDemo(e.target.value);
                    setIsUserMenuOpen(false);
                  }}
                >
                  {DEMO_USERS.map((u) => (
                    <option key={u.uid} value={u.role} style={{ background: "#0d1b2a", color: "#fff" }}>
                      {u.displayName} ({u.role.toUpperCase()} • {u.department})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="topbar-menu-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Secure Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
