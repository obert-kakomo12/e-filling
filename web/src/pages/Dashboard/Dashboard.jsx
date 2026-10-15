import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DEPARTMENTS, hasPermission, ROLES } from "../../utils/rbac";
import Badge from "../../components/Badge/Badge";
import { ArrowRight } from "lucide-react";
import "./Dashboard.css";

export const Dashboard = () => {
  const { user } = useAuth();
  const deptInfo = DEPARTMENTS[user?.department] || {
    code: user?.department || "ADM",
    name: "Masvingo Rural District Council",
  };

  const userRole = user?.role;

  return (
    <div className="dashboard-page-pure">
      {/* 1. Executive Welcome Hero Card */}
      <section className="dashboard-hero-card">
        <div className="hero-info-col">
          <div className="hero-badge-strip">
            <span className="hero-badge-label">Official Workspace</span>
            <Badge type="role" value={userRole} />
          </div>
          <h1 className="hero-heading">Welcome, {user?.displayName}</h1>
          <p className="hero-sub">
            {deptInfo.name} ({deptInfo.code}) • Masvingo Rural District Council E-Filing System
          </p>
        </div>

        <div className="hero-actions-wrap">
          <div className="dept-tag-pill">
            <span>{deptInfo.code}</span>
          </div>

          {hasPermission(userRole, "canUpload") && (
            <Link
              to="/upload"
              className="btn btn-primary"
              style={{
                padding: "0.55rem 1.15rem",
                fontSize: "0.82rem",
                fontWeight: "700",
              }}
            >
              New Upload
            </Link>
          )}

          <Link
            to="/vault"
            className="btn btn-secondary"
            style={{
              padding: "0.55rem 1.15rem",
              fontSize: "0.82rem",
              fontWeight: "700",
            }}
          >
            File Vault
          </Link>
        </div>
      </section>

      {/* 2. 4 Primary KPI Stat Cards (Clean, icon-free executive metrics) */}
      <div className="dashboard-kpi-grid">
        <div className="dashboard-kpi-card kpi-accent-documents">
          <span className="kpi-title-label">Active Documents</span>
          <span className="kpi-val-number">142</span>
        </div>

        <div className="dashboard-kpi-card kpi-accent-approvals">
          <span className="kpi-title-label">Pending Approvals</span>
          <span className="kpi-val-number">8</span>
        </div>

        <div className="dashboard-kpi-card kpi-accent-records">
          <span className="kpi-title-label">Published Records</span>
          <span className="kpi-val-number">96</span>
        </div>

        <div className="dashboard-kpi-card kpi-accent-audit">
          <span className="kpi-title-label">Audit Events</span>
          <span className="kpi-val-number">1,420</span>
        </div>
      </div>

      {/* 3. Dedicated Workspace Navigation Cards (Clean typography & link action) */}
      <div className="dashboard-workspaces-grid">
        {/* Card 1: Document Routing Engine & Category Matrix */}
        <Link to="/routing" className="workspace-nav-card workspace-accent-routing">
          <div className="workspace-card-body">
            <h3 className="workspace-card-title">Document Routing Engine</h3>
            <p className="workspace-card-desc">
              Section 4 automated conditional matrix, trigger flags, and live RBAC clearance simulator.
            </p>
          </div>
          <div className="workspace-card-footer">
            <span>Launch Routing Matrix</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Card 2: Executive Clearance & Approvals */}
        <Link to="/approvals" className="workspace-nav-card workspace-accent-approvals">
          <div className="workspace-card-body">
            <h3 className="workspace-card-title">Approvals & Clearance Queue</h3>
            <p className="workspace-card-desc">
              Review pending submissions, issue 1-click approvals, and manage rejection bounce-backs.
            </p>
          </div>
          <div className="workspace-card-footer">
            <span>Open Approvals Queue</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Card 3: Councilor Portal OR File Vault */}
        {userRole === ROLES.COUNCILOR ? (
          <Link to="/councilor" className="workspace-nav-card workspace-accent-councilor">
            <div className="workspace-card-body">
              <h3 className="workspace-card-title">Councilor Legislative Portal</h3>
              <p className="workspace-card-desc">
                Review enacted resolutions, adopted capital budgets, and lodge notices of motion.
              </p>
            </div>
            <div className="workspace-card-footer">
              <span>Open Legislative Chamber</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        ) : (
          <Link to="/vault" className="workspace-nav-card workspace-accent-vault">
            <div className="workspace-card-body">
              <h3 className="workspace-card-title">Official File Vault</h3>
              <p className="workspace-card-desc">
                Multi-faceted search, departmental filters, and universal security watermarked viewer.
              </p>
            </div>
            <div className="workspace-card-footer">
              <span>Explore Document Vault</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        )}
      </div>

      {/* 4. Institutional Compliance & Security Status Strip */}
      <footer className="dashboard-security-strip">
        <div className="security-strip-left">
          <div className="security-strip-item">
            <span className="security-dot-online" />
            <span><strong>Institutional Vault:</strong> Online & Synchronized</span>
          </div>
          <div className="security-strip-item">
            <span>Cryptographic Chained SHA-256 Audit Log Active</span>
          </div>
        </div>

        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
          Statutory Compliance: Rural District Councils Act [Chapter 29:13]
        </div>
      </footer>
    </div>
  );
};
export default Dashboard;
