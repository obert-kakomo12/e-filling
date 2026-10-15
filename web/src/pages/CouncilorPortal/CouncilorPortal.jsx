// Masvingo Rural District Council — Councilor Legislative & Governance Portal
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchUserDocuments } from "../../services/documentService";
import { DOCUMENT_STATUS, DOCUMENT_TYPES } from "../../utils/rbac";
import FileViewer from "../../components/FileViewer/FileViewer";
import Badge from "../../components/Badge/Badge";
import { logAuditEvent, AUDIT_ACTIONS } from "../../services/auditService";
import {
  Landmark,
  FileText,
  CheckCircle,
  Calendar,
  Search,
  Filter,
  ShieldCheck,
  Eye,
  PlusCircle,
  X,
  FileCheck,
  BookOpen,
  Users,
  Award,
  Vote,
  Clock,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import "./CouncilorPortal.css";

const PORTFOLIO_TABS = [
  { id: "all", label: "All Published Records", icon: BookOpen },
  { id: "resolutions", label: "Council Resolutions", icon: Award },
  { id: "budgets", label: "Adopted Budgets & Tariffs", icon: Landmark },
  { id: "reports", label: "Ward Infrastructure Reports", icon: FileCheck },
];

export const CouncilorPortal = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Ward Motion Submission Modal State
  const [isMotionModalOpen, setIsMotionModalOpen] = useState(false);
  const [motionData, setMotionData] = useState({
    title: "",
    committee: "Full Council Ordinary Session",
    ward: "Ward 14 (Charumbira Rural)",
    description: "",
    proposedResolution: "",
  });
  const [submittedMotions, setSubmittedMotions] = useState([]);
  const [motionSuccessMsg, setMotionSuccessMsg] = useState("");

  const wardNumber = user?.ward || "14";
  const councilTerm = "2023 – 2028 Electoral Cycle";

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const all = await fetchUserDocuments(user);
      // Strictly published records
      const published = all.filter((d) => d.status === DOCUMENT_STATUS.PUBLISHED);
      setDocuments(published);
    } catch (err) {
      console.error("Failed to load councilor documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // Load existing motions submitted by councilor from localStorage
    try {
      const localMotions = JSON.parse(
        localStorage.getItem(`mrdc_councilor_motions_${user?.uid || "demo"}`) || "[]"
      );
      setSubmittedMotions(localMotions);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Tab Filtering
  const filteredDocs = documents.filter((doc) => {
    // Search filter
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.refNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "resolutions") {
      return (
        doc.documentType === DOCUMENT_TYPES.RESOLUTION ||
        doc.title.toLowerCase().includes("resolution") ||
        doc.tags?.includes("resolution") ||
        doc.tags?.includes("by-laws")
      );
    }
    if (activeTab === "budgets") {
      return (
        doc.documentType === DOCUMENT_TYPES.BUDGET ||
        doc.title.toLowerCase().includes("budget") ||
        doc.title.toLowerCase().includes("tariff") ||
        doc.tags?.includes("budget")
      );
    }
    if (activeTab === "reports") {
      return (
        doc.documentType === DOCUMENT_TYPES.OPERATIONAL_REPORT ||
        doc.title.toLowerCase().includes("progress") ||
        doc.title.toLowerCase().includes("devolution") ||
        doc.tags?.includes("devolution")
      );
    }
    return true;
  });

  const handleOpenDoc = async (doc) => {
    setSelectedDoc(doc);
    await logAuditEvent({
      user,
      action: AUDIT_ACTIONS.VIEW_DOC,
      documentId: doc.id,
      refNumber: doc.refNumber,
      notes: `Councilor ${user.displayName} (Ward ${wardNumber}) accessed legislative record ${doc.refNumber}`,
    });
  };

  const handleMotionSubmit = async (e) => {
    e.preventDefault();
    if (!motionData.title.trim() || !motionData.proposedResolution.trim()) return;

    const newMotion = {
      id: `motion-${Date.now()}`,
      ref: `MRDC/MOTION/2026/${String(submittedMotions.length + 1).padStart(3, "0")}`,
      title: motionData.title,
      committee: motionData.committee,
      ward: motionData.ward,
      description: motionData.description,
      proposedResolution: motionData.proposedResolution,
      submittedBy: user.displayName,
      submittedAt: new Date().toISOString(),
      status: "Submitted to Council Secretary",
    };

    const updated = [newMotion, ...submittedMotions];
    setSubmittedMotions(updated);
    localStorage.setItem(
      `mrdc_councilor_motions_${user?.uid || "demo"}`,
      JSON.stringify(updated)
    );

    await logAuditEvent({
      user,
      action: "SUBMIT_WARD_MOTION",
      documentId: newMotion.id,
      refNumber: newMotion.ref,
      notes: `Hon. Councilor ${user.displayName} submitted Notice of Motion: "${newMotion.title}" for ${newMotion.committee}`,
    });

    setMotionSuccessMsg(`Notice of Motion ${newMotion.ref} successfully lodged with Council Secretariat.`);
    setMotionData({
      title: "",
      committee: "Full Council Ordinary Session",
      ward: `Ward ${wardNumber} (Masvingo Rural)`,
      description: "",
      proposedResolution: "",
    });
    setTimeout(() => {
      setMotionSuccessMsg("");
      setIsMotionModalOpen(false);
    }, 2000);
  };

  return (
    <div className="councilor-portal-page">
      {/* Legislative Chamber Banner */}
      <section className="legislative-banner">
        <div className="legislative-banner-content">
          <div>
            <div className="legislative-badge-strip">
              <span className="chamber-pill">
                <Landmark size={14} /> Full Council Chamber
              </span>
              <span className="ward-pill">
                <Users size={14} /> Ward {wardNumber} Representative
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                {councilTerm}
              </span>
            </div>

            <h1 className="legislative-title">
              Councilor Governance & Legislative Portal
            </h1>
            <p className="legislative-subtitle">
              Official statutory repository for Hon. Councilor {user?.displayName}. Direct access to enacted Full Council resolutions, adopted capital budgets, ward devolution accounts, and gazetted local authority instruments.
            </p>
          </div>

          <div className="banner-action-group">
            <button
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 14px rgba(201, 162, 39, 0.4)",
              }}
              onClick={() => setIsMotionModalOpen(true)}
            >
              <PlusCircle size={18} /> Lodge Notice of Motion
            </button>
          </div>
        </div>
      </section>

      {/* Statutory Security & Anti-Leak Watermark Notice */}
      <div className="legislative-notice-bar">
        <ShieldCheck size={22} style={{ flexShrink: 0, color: "var(--color-accent)" }} />
        <div>
          <strong>Statutory Compliance & Watermark Guarantee:</strong> Documents in this chamber portal are published for policy formulation and council committee oversight. Every document opened is dynamically imprinted with your name, ward credentials, and official timestamp to guarantee integrity under the Rural District Councils Act [Chapter 29:13].
        </div>
      </div>

      {/* Statutory Summary Cards */}
      <div className="statutory-metrics-grid">
        <div className="stat-card-legislative">
          <div className="stat-icon-wrapper" style={{ background: "rgba(201, 162, 39, 0.15)", color: "var(--color-accent)" }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-number">
              {documents.filter((d) => d.documentType === DOCUMENT_TYPES.RESOLUTION || d.title.includes("Resolution")).length || 2}
            </div>
            <div className="stat-label">Enacted Resolutions</div>
          </div>
        </div>

        <div className="stat-card-legislative">
          <div className="stat-icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
            <Landmark size={24} />
          </div>
          <div>
            <div className="stat-number">
              {documents.filter((d) => d.documentType === DOCUMENT_TYPES.BUDGET || d.title.includes("Budget")).length || 1}
            </div>
            <div className="stat-label">Adopted Budgets</div>
          </div>
        </div>

        <div className="stat-card-legislative">
          <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <FileCheck size={24} />
          </div>
          <div>
            <div className="stat-number">
              {documents.filter((d) => d.documentType === DOCUMENT_TYPES.OPERATIONAL_REPORT || d.title.includes("Progress")).length || 1}
            </div>
            <div className="stat-label">Devolution Reports</div>
          </div>
        </div>

        <div className="stat-card-legislative">
          <div className="stat-icon-wrapper" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
            <Vote size={24} />
          </div>
          <div>
            <div className="stat-number">{submittedMotions.length}</div>
            <div className="stat-label">My Lodged Motions</div>
          </div>
        </div>
      </div>

      {/* Portfolio Filter & Search */}
      <section className="portal-controls-card">
        <div className="portfolio-tabs">
          {PORTFOLIO_TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.id === "all"
                ? documents.length
                : tab.id === "resolutions"
                ? documents.filter((d) => d.documentType === DOCUMENT_TYPES.RESOLUTION || d.title.includes("Resolution")).length
                : tab.id === "budgets"
                ? documents.filter((d) => d.documentType === DOCUMENT_TYPES.BUDGET || d.title.includes("Budget")).length
                : documents.filter((d) => d.documentType === DOCUMENT_TYPES.OPERATIONAL_REPORT || d.title.includes("Progress")).length;

            return (
              <button
                key={tab.id}
                className={`portfolio-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span className="tab-count-badge">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="search-and-filter-row">
          <div className="portal-search-box">
            <Search size={18} style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search legislative records, resolution numbers, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
            Showing <strong>{filteredDocs.length}</strong> official published records
          </div>
        </div>
      </section>

      {/* Legislative Documents Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem auto" }} />
          <p style={{ color: "var(--color-text-secondary)" }}>Loading legislative records from vault...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <BookOpen size={48} style={{ color: "var(--color-text-muted)", margin: "0 auto 1rem auto" }} />
          <h3 style={{ color: "#ffffff", fontSize: "1.1rem" }}>No Published Legislative Records Found</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", marginTop: "0.4rem" }}>
            {searchQuery ? `No records matched query "${searchQuery}"` : "No published records in this portfolio category."}
          </p>
        </div>
      ) : (
        <div className="legislative-docs-grid">
          {filteredDocs.map((doc) => (
            <div key={doc.id || doc.refNumber} className="legislative-card">
              <div>
                <div className="card-top-meta">
                  <span className="doc-ref-number">{doc.refNumber}</span>
                  <Badge type="department" value={doc.department} />
                </div>

                <div className="card-body">
                  <h3>{doc.title}</h3>
                  <p>{doc.description || "Official published council record."}</p>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="card-tags">
                      {doc.tags.map((tag) => (
                        <span key={tag} className="card-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card-footer">
                <span className="seal-certified">
                  <CheckCircle size={15} /> Council Published
                </span>

                <div className="card-actions">
                  <button
                    className="btn-view-legislative"
                    onClick={() => handleOpenDoc(doc)}
                    title="View with Councilor Security Watermark"
                  >
                    <Eye size={15} /> Inspect Document
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Standing Committees & Full Council Calendar Schedule */}
      <section className="standing-committee-schedule">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={18} style={{ color: "var(--color-accent)" }} />
              Council Statutory Calendar & Committee Sessions
            </h3>
            <p style={{ fontSize: "0.84rem", color: "var(--color-text-secondary)", margin: "0.2rem 0 0 0" }}>
              Ordinary meetings and committee hearings scheduled at Masvingo RDC Chambers.
            </p>
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--color-accent)", fontWeight: 700 }}>
            Standing Orders 2026
          </span>
        </div>

        <div className="committee-sessions-list">
          <div className="committee-item">
            <div className="committee-date-badge">
              <div>OCT</div>
              <div style={{ fontSize: "1.1rem" }}>28</div>
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ffffff" }}>
                Full Council Ordinary Session
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
                Chambers • 10:00 AM • Review of Q3 Ward Devolution Allocations
              </div>
            </div>
          </div>

          <div className="committee-item">
            <div className="committee-date-badge">
              <div>NOV</div>
              <div style={{ fontSize: "1.1rem" }}>06</div>
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ffffff" }}>
                Finance, Human Resources & General Purpose
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
                Committee Room 1 • 09:30 AM • FY2027 Tariffs Consultation
              </div>
            </div>
          </div>

          <div className="committee-item">
            <div className="committee-date-badge">
              <div>NOV</div>
              <div style={{ fontSize: "1.1rem" }}>14</div>
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ffffff" }}>
                Roads, Works, Planning & Agriculture
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
                Committee Room 2 • 10:00 AM • Borehole Solar Array Tender Awards
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lodged Motions History (if any) */}
      {submittedMotions.length > 0 && (
        <section className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Vote size={18} style={{ color: "var(--color-accent)" }} />
            My Lodged Ward Motions & Policy Petitions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {submittedMotions.map((m) => (
              <div
                key={m.id}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--color-accent)", fontWeight: 700 }}>
                      {m.ref}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>• {m.committee}</span>
                  </div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>{m.title}</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", margin: "0.3rem 0 0 0" }}>
                    {m.proposedResolution}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "9999px",
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#34d399",
                      fontWeight: 700,
                    }}
                  >
                    {m.status}
                  </span>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.35rem" }}>
                    Lodge Date: {new Date(m.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ward Motion Submission Modal */}
      {isMotionModalOpen && (
        <div className="motion-modal-overlay" onClick={() => setIsMotionModalOpen(false)}>
          <div className="motion-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="motion-modal-header">
              <h3>
                <Vote size={20} style={{ color: "var(--color-accent)" }} />
                Lodge Notice of Motion for Council Agenda
              </h3>
              <button
                onClick={() => setIsMotionModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {motionSuccessMsg ? (
              <div style={{ padding: "2.5rem", textAlign: "center" }}>
                <CheckCircle size={48} style={{ color: "#34d399", margin: "0 auto 1rem auto" }} />
                <h4 style={{ color: "#ffffff", fontSize: "1.1rem" }}>Motion Lodged Successfully</h4>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", marginTop: "0.4rem" }}>
                  {motionSuccessMsg}
                </p>
              </div>
            ) : (
              <form onSubmit={handleMotionSubmit}>
                <div className="motion-modal-body">
                  <div className="form-group">
                    <label>Motion Subject / Short Title *</label>
                    <input
                      type="text"
                      placeholder="e.g., Motion for Urgent Borehole Rehabilitation in Ward 14"
                      value={motionData.title}
                      onChange={(e) => setMotionData({ ...motionData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Target Committee / Session</label>
                      <select
                        value={motionData.committee}
                        onChange={(e) => setMotionData({ ...motionData, committee: e.target.value })}
                      >
                        <option value="Full Council Ordinary Session">Full Council Ordinary Session</option>
                        <option value="Roads, Works & Planning Committee">Roads, Works & Planning Committee</option>
                        <option value="Finance & General Purpose Committee">Finance & General Purpose Committee</option>
                        <option value="Social Services & Health Committee">Social Services & Health Committee</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Ward / Constituency</label>
                      <input
                        type="text"
                        value={motionData.ward}
                        onChange={(e) => setMotionData({ ...motionData, ward: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Background & Justification</label>
                    <textarea
                      rows={3}
                      placeholder="Detail the community need, public health imperative, or policy context..."
                      value={motionData.description}
                      onChange={(e) => setMotionData({ ...motionData, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Proposed Council Resolution Text *</label>
                    <textarea
                      rows={3}
                      placeholder='e.g., "RESOLVED: That Council approves an allocation of USD 15,000 from the Devolution Contingency Fund..."'
                      value={motionData.proposedResolution}
                      onChange={(e) => setMotionData({ ...motionData, proposedResolution: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="motion-modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsMotionModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Motion to Secretariat
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Universal Document Viewer with Dynamic Anti-Leak Watermark */}
      {selectedDoc && (
        <FileViewer
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
};

export default CouncilorPortal;
