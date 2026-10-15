import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, DEPARTMENTS } from "../../utils/rbac";
import Badge from "../Badge/Badge";
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
  Shield,
  Landmark,
  GitFork,
  CheckSquare,
} from "lucide-react";
import "./Sidebar.css";

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

        {/* User Profile Card */}
        {!isCollapsed ? (
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{getInitials(user.displayName)}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name" title={user.displayName}>
                {user.displayName || "Council Officer"}
              </span>
              <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                <Badge type="role" value={user.role} withDot={false} />
              </div>
              <span className="sidebar-user-dept">{deptInfo.code} • {deptInfo.name}</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: "0.85rem 0", display: "flex", justifyContent: "center" }}>
            <div className="sidebar-avatar" title={`${user.displayName} (${user.role})`}>
              {getInitials(user.displayName)}
            </div>
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
                  <Icon className="sidebar-icon" size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
        </nav>

        {/* Footer actions */}
        <div className="sidebar-footer">
          {/* Collapse/Expand Toggle on Desktop */}
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span>Collapse Menu</span>}
          </button>

          {/* Sign Out */}
          <button
            type="button"
            className="sidebar-signout-btn"
            onClick={handleLogout}
            title="Secure Sign Out"
            id="btn-sidebar-signout"
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
