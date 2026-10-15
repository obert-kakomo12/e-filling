import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, DEPARTMENTS } from "../../utils/rbac";
import { DEMO_USERS } from "../../services/authService";
import Badge from "../Badge/Badge";
import NotificationBell from "../NotificationBell/NotificationBell";
import {
  LayoutDashboard,
  UploadCloud,
  FolderLock,
  Archive,
  ShieldCheck,
  Sliders,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Landmark,
  GitFork,
  CheckSquare,
  Search,
  X,
  Clock,
} from "lucide-react";
import "./Sidebar.css";

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5-minute inactivity countdown

  // Inactivity countdown: 5 minutes = 300 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

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

  if (!user) return null;

  const userRole = user.role;
  const deptInfo = DEPARTMENTS[user.department] || { code: user.department || "ADM", name: "Masvingo RDC" };

  const getInitials = (name) => {
    if (!name) return "CO";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/vault?search=${encodeURIComponent(searchQuery.trim())}`);
      if (isMobileOpen && setIsMobileOpen) setIsMobileOpen(false);
    }
  };

  const navLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: "/upload",
      label: "Upload Room",
      icon: UploadCloud,
      show: hasPermission(userRole, "canUpload"),
    },
    {
      to: "/vault",
      label: "File Vault",
      icon: FolderLock,
      show: true,
    },
    {
      to: "/approvals",
      label: "Clearance Queue",
      icon: CheckSquare,
      show: hasPermission(userRole, "canApprove") || userRole === "ceo" || userRole === "sysadmin",
    },
    {
      to: "/routing",
      label: "Routing Matrix",
      icon: GitFork,
      show: userRole !== "councilor" && userRole !== "external_auditor",
    },
    {
      to: "/councilor",
      label: "Councilor Portal",
      icon: Landmark,
      show: userRole === "councilor" || userRole === "sysadmin" || userRole === "ceo",
    },
    {
      to: "/archive",
      label: "Archive Vault",
      icon: Archive,
      show: hasPermission(userRole, "canArchiveFiscalYear") || userRole === "sysadmin",
    },
    {
      to: "/audit-log",
      label: "Audit Trail",
      icon: ShieldCheck,
      show: hasPermission(userRole, "canViewAuditLog"),
    },
    {
      to: "/admin",
      label: "Council Admin",
      icon: Sliders,
      show: hasPermission(userRole, "canManageUsers"),
    },
  ];

  const handleLinkClick = () => {
    if (isMobileOpen && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`mrdc-sidebar ${isCollapsed ? "collapsed" : ""} ${
          isMobileOpen ? "mobile-open" : ""
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <NavLink to="/dashboard" className="sidebar-brand" onClick={handleLinkClick}>
          <img
            src="/mrdc_logo.jpg"
            alt="MRDC Seal"
            className="sidebar-logo-img"
          />
          {!isCollapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">MRDC E-FILING</span>
              <span className="sidebar-brand-subtitle">Masvingo RDC Vault</span>
            </div>
          )}
        </NavLink>

        {/* User Profile Section with Notification Bell & Inactivity Timer */}
        {!isCollapsed ? (
          <div className="sidebar-user-card">
            <div className="sidebar-user-card-top">
              <div className="sidebar-avatar">{getInitials(user.displayName)}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name" title={user.displayName}>
                  {user.displayName || "Council Officer"}
                </span>
                <span className="sidebar-user-dept">{deptInfo.code} • {deptInfo.name}</span>
              </div>
              <div className="sidebar-user-actions">
                <NotificationBell />
              </div>
            </div>

            <div className="sidebar-user-card-meta">
              <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                <Badge type="role" value={user.role} withDot={false} />
              </div>

              <div
                className="sidebar-session-timer"
                title="Auto-timeout session timer resets on user activity"
              >
                <span className={`sidebar-session-dot ${secondsRemaining < 60 ? "warning" : ""}`} />
                <Clock size={11} />
                <span>{formatCountdown(secondsRemaining)}</span>
              </div>
            </div>

            {/* Test Role Switcher */}
            <div className="sidebar-role-switch-wrap">
              <select
                className="sidebar-role-select"
                value={user?.role}
                onChange={(e) => loginAsDemo(e.target.value)}
                title="Switch Demo Role"
              >
                {DEMO_USERS.map((u) => (
                  <option key={u.uid} value={u.role}>
                    {u.displayName} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="sidebar-collapsed-profile">
            <div className="sidebar-avatar" title={`${user.displayName} (${user.role})`}>
              {getInitials(user.displayName)}
            </div>
            <div style={{ transform: "scale(0.85)" }}>
              <NotificationBell />
            </div>
          </div>
        )}

        {/* Global Search Bar */}
        {!isCollapsed && (
          <div className="sidebar-search-container">
            <form className="sidebar-search-wrap" onSubmit={handleSearchSubmit}>
              <Search size={14} className="sidebar-search-icon" />
              <input
                type="text"
                className="sidebar-search-input"
                placeholder="Search files or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search files in vault"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="sidebar-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </form>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {!isCollapsed && <span className="sidebar-nav-label">Navigation</span>}

          {navLinks
            .filter((link) => link.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-nav-link ${isActive ? "active" : ""}`
                  }
                  title={isCollapsed ? item.label : undefined}
                  onClick={handleLinkClick}
                >
                  <Icon className="sidebar-icon" size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
        </nav>

        {/* Reduced & Compact Footer: Side-by-side Collapse & Sign Out */}
        <div className={`sidebar-footer ${isCollapsed ? "footer-collapsed" : ""}`}>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>

          <button
            type="button"
            className="sidebar-signout-btn-reduced"
            onClick={handleLogout}
            title="Secure Sign Out"
            id="btn-sidebar-signout"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
