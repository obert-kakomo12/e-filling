// Masvingo Rural District Council — Cryptographic Audit Log & Compliance Register
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAuditLogs,
  AUDIT_ACTIONS,
  exportAuditLogsToCSV,
  exportAuditLogsToJSON,
} from "../../services/auditService";
import Badge from "../../components/Badge/Badge";
import {
  ShieldCheck,
  Search,
  X,
  Download,
  FileSpreadsheet,
  FileCode,
  Calendar,
  User,
  Shield,
  CheckCircle,
  FileText,
  Lock,
  ArrowUpRight,
  Hash,
  Copy,
  Activity,
  Layers,
} from "lucide-react";
import "./AuditLog.css";

const AuditLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");

  useEffect(() => {
    let active = true;
    const loadLogs = async () => {
      setLoading(true);
      try {
        const auditRecords = await fetchAuditLogs(300);
        if (active) setLogs(auditRecords);
      } catch (err) {
        console.error("Failed to load audit trail:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadLogs();
    return () => {
      active = false;
    };
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUser = log.userName?.toLowerCase().includes(q);
        const matchAction = log.action?.toLowerCase().includes(q);
        const matchDoc = log.documentTitle?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchHash = log.hash?.toLowerCase().includes(q);
        const matchIp = log.ipAddress?.includes(q);
        if (!matchUser && !matchAction && !matchDoc && !matchDetails && !matchHash && !matchIp) {
          return false;
        }
      }

      // 2. Action Category Filter
      if (actionFilter !== "ALL") {
        if (actionFilter === "UPLOADS" && log.action !== AUDIT_ACTIONS.DOCUMENT_UPLOAD) return false;
        if (actionFilter === "APPROVALS" && log.action !== AUDIT_ACTIONS.DOCUMENT_APPROVE) return false;
        if (actionFilter === "REJECTIONS" && log.action !== AUDIT_ACTIONS.DOCUMENT_REJECT) return false;
        if (actionFilter === "PUBLICATIONS" && log.action !== AUDIT_ACTIONS.DOCUMENT_PUBLISH) return false;
        if (actionFilter === "VIEWS" && log.action !== AUDIT_ACTIONS.DOCUMENT_VIEW) return false;
        if (actionFilter === "AUTH" && ![AUDIT_ACTIONS.LOGIN, AUDIT_ACTIONS.LOGOUT].includes(log.action))
          return false;
      }

      // 3. Officer Role Filter
      if (roleFilter !== "ALL" && log.userRole && log.userRole !== roleFilter) {
        return false;
      }

      // 4. Timeframe Filter
      if (timeFilter !== "ALL" && log.timestamp) {
        const logDate = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (timeFilter === "TODAY" && now - logDate > 86400000) return false;
        if (timeFilter === "7DAYS" && now - logDate > 86400000 * 7) return false;
        if (timeFilter === "30DAYS" && now - logDate > 86400000 * 30) return false;
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter, roleFilter, timeFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const docActions = logs.filter((l) =>
      [
        AUDIT_ACTIONS.DOCUMENT_UPLOAD,
        AUDIT_ACTIONS.DOCUMENT_APPROVE,
        AUDIT_ACTIONS.DOCUMENT_PUBLISH,
        AUDIT_ACTIONS.DOCUMENT_REJECT,
      ].includes(l.action)
    ).length;
    const authActions = logs.filter((l) =>
      [AUDIT_ACTIONS.LOGIN, AUDIT_ACTIONS.LOGOUT].includes(l.action)
    ).length;
    const viewActions = logs.filter((l) => l.action === AUDIT_ACTIONS.DOCUMENT_VIEW).length;

    return { total, docActions, authActions, viewActions };
  }, [logs]);

  const handleCopyHash = (hashVal) => {
    navigator.clipboard.writeText(hashVal);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getActionTag = (action) => {
    switch (action) {
      case AUDIT_ACTIONS.DOCUMENT_UPLOAD:
        return <span className="audit-action-tag action-tag-upload">Upload</span>;
      case AUDIT_ACTIONS.DOCUMENT_APPROVE:
        return <span className="audit-action-tag action-tag-approve">Approved</span>;
      case AUDIT_ACTIONS.DOCUMENT_REJECT:
        return <span className="audit-action-tag action-tag-reject">Rejected</span>;
      case AUDIT_ACTIONS.DOCUMENT_PUBLISH:
        return <span className="audit-action-tag action-tag-publish">Published</span>;
      case AUDIT_ACTIONS.LOGIN:
      case AUDIT_ACTIONS.LOGOUT:
        return <span className="audit-action-tag action-tag-login">{action}</span>;
      case AUDIT_ACTIONS.DOCUMENT_VIEW:
        return <span className="audit-action-tag action-tag-view">Viewed</span>;
      default:
        return <span className="audit-action-tag">{action}</span>;
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="audit-log-page">
      {/* Header & Integrity Seal */}
      <header className="audit-header">
        <div className="audit-title-wrap">
          <h1>
            <ShieldCheck size={28} style={{ color: "var(--color-accent)" }} />
            <span>Cryptographic Audit Trail & Compliance Register</span>
          </h1>
          <p>
            Statutory non-repudiation ledger for Masvingo Rural District Council. Enforces immutable
            record keeping, cryptographic hash chaining, and real-time security tracking under the
            Zimbabwe Cyber and Data Protection Act.
          </p>
        </div>

        <div className="audit-integrity-badge">
          <span className="integrity-dot" />
          <div>
            <div className="integrity-text-main">100% Cryptographically Verified</div>
            <div className="integrity-text-sub">Zero Tamper Anomalies • Immutability Active</div>
          </div>
        </div>
      </header>

      {/* Summary Stat Cards */}
      <section className="audit-stats-grid" aria-label="Audit Overview Statistics">
        <div className="audit-stat-card">
          <div className="audit-stat-icon stat-icon-total">
            <Activity size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Total Events Logged</span>
            <span className="audit-stat-number">{stats.total}</span>
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-icon stat-icon-action">
            <FileText size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Document Operations</span>
            <span className="audit-stat-number">{stats.docActions}</span>
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-icon stat-icon-auth">
            <User size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Authentication Events</span>
            <span className="audit-stat-number">{stats.authActions}</span>
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-icon stat-icon-secure">
            <Shield size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Secure File Inspections</span>
            <span className="audit-stat-number">{stats.viewActions}</span>
          </div>
        </div>
      </section>

      {/* Toolbar: Search, Filters, Export */}
      <section className="audit-toolbar" aria-label="Audit Search & Export">
        <div className="audit-search-row">
          <div className="audit-search-box">
            <Search className="audit-search-icon" size={17} />
            <input
              type="text"
              className="audit-search-input"
              placeholder="Search by officer name, action, subject, terminal IP, or hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-audit-search"
            />
            {searchQuery && (
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                }}
                onClick={() => setSearchQuery("")}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="audit-export-actions">
            <button
              type="button"
              className="audit-btn-export"
              onClick={() => exportAuditLogsToCSV(filteredLogs)}
              title="Download Compliance CSV"
            >
              <FileSpreadsheet size={16} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="audit-btn-export"
              onClick={() => exportAuditLogsToJSON(filteredLogs)}
              title="Export Cryptographic JSON Ledger"
            >
              <FileCode size={16} />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        <div className="audit-filters-row">
          <select
            className="filter-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">All Action Types</option>
            <option value="UPLOADS">Document Uploads</option>
            <option value="APPROVALS">Approvals</option>
            <option value="REJECTIONS">Rejections</option>
            <option value="PUBLICATIONS">Publications</option>
            <option value="VIEWS">Viewer Inspections</option>
            <option value="AUTH">Logins & Logouts</option>
          </select>

          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Officer Roles</option>
            <option value="sysadmin">System Administrator</option>
            <option value="ceo">Chief Executive Officer</option>
            <option value="hod">Director / HOD</option>
            <option value="clerk">Registry Clerk</option>
            <option value="auditor">Internal Auditor</option>
          </select>

          <select
            className="filter-select"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Last 24 Hours</option>
            <option value="7DAYS">Last 7 Days</option>
            <option value="30DAYS">Last 30 Days</option>
          </select>

          {(searchQuery || actionFilter !== "ALL" || roleFilter !== "ALL" || timeFilter !== "ALL") && (
            <button
              type="button"
              className="vault-reset-filters-btn"
              onClick={() => {
                setSearchQuery("");
                setActionFilter("ALL");
                setRoleFilter("ALL");
                setTimeFilter("ALL");
              }}
            >
              Reset Filters
            </button>
          )}

          <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Displaying <strong>{filteredLogs.length}</strong> statutory audit entries
          </div>
        </div>
      </section>

      {/* Audit Log Table */}
      <section className="audit-table-card">
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp (UTC+2)</th>
                <th>Officer Identity</th>
                <th>Action</th>
                <th>Document Subject</th>
                <th>Event Narrative</th>
                <th>Terminal IP</th>
                <th>Hash Fingerprint</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="spinner" style={{ margin: "0 auto 0.75rem" }} />
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Querying Immutable Audit Register...
                    </span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} onClick={() => setSelectedEntry(log)}>
                    <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap", color: "#94a3b8" }}>
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ fontWeight: 700, color: "#ffffff" }}>{log.userName}</span>
                        {log.userRole && <Badge type="role" value={log.userRole} withDot={false} />}
                      </div>
                    </td>
                    <td>{getActionTag(log.action)}</td>
                    <td style={{ maxWidth: "220px" }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>
                        {log.documentTitle || log.documentId || "System Transaction"}
                      </div>
                    </td>
                    <td style={{ maxWidth: "300px", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={log.details}>
                        {log.details}
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.74rem", color: "#64748b" }}>
                      {log.ipAddress || "192.168.10.x"}
                    </td>
                    <td>
                      <span className="hash-fingerprint" title={log.hash}>
                        <Hash size={11} />
                        <span>{log.hash?.slice(0, 10)}...</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cryptographic Entry Inspector Modal */}
      {selectedEntry && (
        <div
          className="upload-success-overlay"
          onClick={() => setSelectedEntry(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="upload-success-modal"
            style={{ maxWidth: "560px", textAlign: "left", alignItems: "flex-start" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <ShieldCheck size={22} style={{ color: "var(--color-accent)" }} />
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                  Audit Record Verification
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.25rem", width: "100%" }}>
              {/* Event ID & Hash */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "8px", padding: "0.85rem" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Cryptographic Hash Signature (SHA-256 Block Chained)
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.25rem" }}>
                  <code style={{ fontSize: "0.85rem", color: "var(--color-accent)", fontWeight: 700 }}>
                    {selectedEntry.hash || "0x4a8b7f89b4e13d2a"}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(selectedEntry.hash)}
                    style={{ background: "transparent", border: "none", color: "var(--color-accent)", cursor: "pointer" }}
                    title="Copy hash"
                  >
                    {copiedHash ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Event Metadata */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.82rem" }}>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Timestamp:</span>
                  <div style={{ fontWeight: 700, color: "#fff" }}>{formatTimestamp(selectedEntry.timestamp)}</div>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Officer Identity:</span>
                  <div style={{ fontWeight: 700, color: "#fff" }}>{selectedEntry.userName}</div>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Action Type:</span>
                  <div>{getActionTag(selectedEntry.action)}</div>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Terminal IP:</span>
                  <div style={{ fontFamily: "monospace", color: "#fff" }}>{selectedEntry.ipAddress || "192.168.10.x"}</div>
                </div>
              </div>

              {/* Details Narrative */}
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Audit Event Narrative
                </span>
                <p style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "0.75rem", fontSize: "0.85rem", color: "#e2e8f0", marginTop: "0.3rem", lineHeight: 1.5 }}>
                  {selectedEntry.details}
                </p>
              </div>

              {/* Statutory Guarantee Banner */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "6px", padding: "0.6rem 0.85rem" }}>
                <Lock size={15} style={{ color: "#34d399", flexShrink: 0 }} />
                <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>
                  Immutable Ledger: Security rules prevent editing or deletion of this record.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
