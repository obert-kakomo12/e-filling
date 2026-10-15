// Masvingo Rural District Council — SysAdmin Console & User Management
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { DEPARTMENTS, ROLES } from "../../utils/rbac";
import {
  fetchCouncilUsers,
  createCouncilUser,
  createExternalAuditorUser,
  toggleUserActiveStatus,
} from "../../services/authService";
import Badge from "../../components/Badge/Badge";
import {
  Sliders,
  UserPlus,
  Shield,
  Search,
  X,
  Building,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Lock,
  Clock,
  Sparkles,
  Users,
  Briefcase,
  KeyRound,
} from "lucide-react";
import "./AdminPanel.css";

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuditorModalOpen, setIsAuditorModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Form: Create Council Officer
  const [officerForm, setOfficerForm] = useState({
    displayName: "",
    email: "",
    title: "",
    department: "ADM",
    role: "clerk",
  });

  // Form: Create External Auditor
  const [auditorForm, setAuditorForm] = useState({
    displayName: "",
    email: "",
    firm: "Office of the Auditor General (OAG)",
    validDays: 30,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await fetchCouncilUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error("Failed to load user directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.displayName?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchTitle = u.title?.toLowerCase().includes(q);
        const matchDept = u.department?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchTitle && !matchDept) return false;
      }
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (deptFilter !== "ALL" && u.department !== deptFilter) return false;
      return true;
    });
  }, [users, searchQuery, roleFilter, deptFilter]);

  // Department distribution count
  const deptCounts = useMemo(() => {
    const counts = {};
    Object.keys(DEPARTMENTS).forEach((code) => {
      counts[code] = users.filter((u) => u.department === code).length;
    });
    return counts;
  }, [users]);

  // Handlers
  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    if (!officerForm.displayName.trim() || !officerForm.email.trim()) {
      setFeedbackMsg("Please enter both officer full name and email.");
      return;
    }

    try {
      const newUser = await createCouncilUser({
        ...officerForm,
        createdBy: user,
      });
      setUsers([newUser, ...users]);
      setIsCreateModalOpen(false);
      setOfficerForm({
        displayName: "",
        email: "",
        title: "",
        department: "ADM",
        role: "clerk",
      });
      setFeedbackMsg(`Successfully provisioned ${newUser.displayName}`);
      setTimeout(() => setFeedbackMsg(""), 3500);
    } catch (err) {
      setFeedbackMsg(err.message || "Failed to create officer account.");
    }
  };

  const handleCreateAuditor = async (e) => {
    e.preventDefault();
    if (!auditorForm.displayName.trim() || !auditorForm.email.trim()) {
      setFeedbackMsg("Please enter auditor name and email.");
      return;
    }

    try {
      const newAuditor = await createExternalAuditorUser({
        ...auditorForm,
        createdBy: user,
      });
      setUsers([newAuditor, ...users]);
      setIsAuditorModalOpen(false);
      setAuditorForm({
        displayName: "",
        email: "",
        firm: "Office of the Auditor General (OAG)",
        validDays: 30,
      });
      setFeedbackMsg(`Provisioned temporary External Auditor account for ${newAuditor.displayName}`);
      setTimeout(() => setFeedbackMsg(""), 3500);
    } catch (err) {
      setFeedbackMsg(err.message || "Failed to provision auditor account.");
    }
  };

  const handleToggleStatus = async (targetUser) => {
    try {
      const newStatus = await toggleUserActiveStatus(targetUser.uid, targetUser.isActive, user);
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, isActive: newStatus } : u))
      );
      setFeedbackMsg(
        `Account for ${targetUser.displayName} is now ${newStatus ? "ACTIVE" : "SUSPENDED"}`
      );
      setTimeout(() => setFeedbackMsg(""), 3000);
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  return (
    <div className="admin-panel-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-title-wrap">
          <h1>
            <Sliders size={28} style={{ color: "var(--color-accent)" }} />
            <span>Council Administration Console & User Provisioning</span>
          </h1>
          <p>
            Authorized SysAdmin master control for Masvingo Rural District Council. Provision council
            officers, enforce RBAC permissions, manage departmental quotas, and issue temporary
            credentials for external oversight auditors.
          </p>
        </div>

        <div className="admin-authority-badge">
          <Shield size={20} className="authority-icon" />
          <div>
            <div className="authority-title">SysAdmin Master Authority</div>
            <div className="authority-sub">Full Council Governance Active</div>
          </div>
        </div>
      </header>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "#34d399",
            borderRadius: "var(--radius-lg)",
            padding: "0.85rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.88rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Overview Stats */}
      <section className="admin-stats-grid" aria-label="SysAdmin Statistics">
        <div className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-users">
            <Users size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Total Officers</span>
            <span className="audit-stat-number">{users.length}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-depts">
            <Building size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Departments Active</span>
            <span className="audit-stat-number">7</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-ext">
            <Briefcase size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">External Auditors</span>
            <span className="audit-stat-number">
              {users.filter((u) => u.role === "external_auditor").length}
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-roles">
            <KeyRound size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Active Roles</span>
            <span className="audit-stat-number">8 Tiers</span>
          </div>
        </div>
      </section>

      {/* Department Distribution Strip */}
      <section className="dept-distribution-bar" aria-label="Department Staff Distribution">
        <span className="dept-dist-label">Staff Distribution:</span>
        <div className="dept-dist-chips">
          {Object.values(DEPARTMENTS).map((d) => (
            <div key={d.code} className="dept-dist-chip">
              <span style={{ fontWeight: 800, color: "var(--color-accent)" }}>{d.code}:</span>
              <span>{deptCounts[d.code] || 0}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Toolbar: Search, Filters & Provisioning Actions */}
      <section className="admin-toolbar" aria-label="User Directory Controls">
        <div className="admin-toolbar-row1">
          <div className="vault-search-box">
            <Search className="vault-search-icon" size={17} />
            <input
              type="text"
              className="vault-search-input"
              placeholder="Search officer by name, email, department, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-admin-search"
            />
            {searchQuery && (
              <button
                type="button"
                className="vault-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="admin-actions-group">
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              id="btn-provision-officer"
            >
              <UserPlus size={16} />
              <span>Provision Officer</span>
            </button>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => setIsAuditorModalOpen(true)}
              id="btn-provision-auditor"
            >
              <Briefcase size={16} />
              <span>Provision External Auditor</span>
            </button>
          </div>
        </div>

        <div className="vault-filters-row">
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles (8 Tiers)</option>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {r.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {Object.values(DEPARTMENTS).map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} — {d.name}
              </option>
            ))}
          </select>

          {(searchQuery || roleFilter !== "ALL" || deptFilter !== "ALL") && (
            <button
              type="button"
              className="vault-reset-filters-btn"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setDeptFilter("ALL");
              }}
            >
              Reset Filters
            </button>
          )}

          <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Showing <strong>{filteredUsers.length}</strong> active council accounts
          </div>
        </div>
      </section>

      {/* User Directory Table */}
      <section className="admin-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Officer Name & Title</th>
                <th>Council Email</th>
                <th>Dept</th>
                <th>Role Tier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="spinner" style={{ margin: "0 auto 0.75rem" }} />
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Loading Council Staff Directory...
                    </span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                    No officers match your filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 800, color: "#ffffff" }}>{u.displayName}</span>
                        <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                          {u.title || "Council Officer"}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", color: "var(--color-accent)" }}>
                      {u.email}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{u.department}</span>
                    </td>
                    <td>
                      <Badge type="role" value={u.role} withDot={false} />
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.78rem" }}>
                        <span className={`user-status-dot ${u.isActive !== false ? "active" : "suspended"}`} />
                        <span>{u.isActive !== false ? "Active" : "Suspended"}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {u.uid !== user?.uid && (
                          <button
                            type="button"
                            className={u.isActive !== false ? "admin-action-btn-danger" : "admin-action-btn-small"}
                            onClick={() => handleToggleStatus(u)}
                            title={u.isActive !== false ? "Suspend Account" : "Re-activate Account"}
                          >
                            {u.isActive !== false ? <UserX size={13} /> : <UserCheck size={13} />}
                            <span>{u.isActive !== false ? "Suspend" : "Activate"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal 1: Provision Council Officer */}
      {isCreateModalOpen && (
        <div className="upload-success-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <UserPlus size={22} style={{ color: "var(--color-accent)" }} />
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff" }}>
                  Provision Council Officer
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOfficer} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Full Name & Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Eng. T. Chikoto"
                  value={officerForm.displayName}
                  onChange={(e) => setOfficerForm({ ...officerForm, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Council Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. t.chikoto@mrdc.gov.zw"
                  value={officerForm.email}
                  onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department Assignment *</label>
                <select
                  className="form-select"
                  value={officerForm.department}
                  onChange={(e) => setOfficerForm({ ...officerForm, department: e.target.value })}
                >
                  {Object.values(DEPARTMENTS).map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Council Role Tier *</label>
                <select
                  className="form-select"
                  value={officerForm.role}
                  onChange={(e) => setOfficerForm({ ...officerForm, role: e.target.value })}
                >
                  <option value={ROLES.CLERK}>Registry Clerk (Upload & search own dept)</option>
                  <option value={ROLES.HOD}>Director / HOD (Own dept approval + routed)</option>
                  <option value={ROLES.SPECIALIZED_OFFICER}>Specialized Officer (PMU / Finance)</option>
                  <option value={ROLES.AUDITOR}>Internal Auditor (Global compliance read-only)</option>
                  <option value={ROLES.COUNCILOR}>Councilor (Published records only)</option>
                  <option value={ROLES.CEO}>Chief Executive Officer (Executive Tier)</option>
                  <option value={ROLES.SYSADMIN}>System Administrator (Master Admin)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Official Job Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Civil Engineering Officer"
                  value={officerForm.title}
                  onChange={(e) => setOfficerForm({ ...officerForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  <UserPlus size={16} />
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Provision Temporary External Auditor */}
      {isAuditorModalOpen && (
        <div className="upload-success-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Briefcase size={22} style={{ color: "#fb923c" }} />
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff" }}>
                  Provision External Auditor Credentials
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditorModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAuditor} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: 0 }}>
                Temporary accounts created for external oversight bodies (OAG, private auditors).
                External auditors are strictly restricted to <strong>Approved & Published Invoices, Receipts, and Budgets</strong>.
              </p>

              <div className="form-group">
                <label className="form-label">Auditor Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. K. Mavhunga"
                  value={auditorForm.displayName}
                  onChange={(e) => setAuditorForm({ ...auditorForm, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Audit Institution / Firm *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Office of the Auditor General (OAG)"
                  value={auditorForm.firm}
                  onChange={(e) => setAuditorForm({ ...auditorForm, firm: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Auditor Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. auditor@audit.gov.zw"
                  value={auditorForm.email}
                  onChange={(e) => setAuditorForm({ ...auditorForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Audit Clearance Validity Window</label>
                <select
                  className="form-select"
                  value={auditorForm.validDays}
                  onChange={(e) => setAuditorForm({ ...auditorForm, validDays: e.target.value })}
                >
                  <option value={14}>14 Days (Standard Inspection)</option>
                  <option value={30}>30 Days (Annual Statutory Audit)</option>
                  <option value={60}>60 Days (Comprehensive Audit)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsAuditorModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-secondary">
                  <Briefcase size={16} />
                  <span>Issue Audit Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
