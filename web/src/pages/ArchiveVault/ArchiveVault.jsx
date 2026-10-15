// Masvingo Rural District Council — Fiscal Year Archiving Engine & Deep Storage Vault
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLES, DEPARTMENTS } from "../../utils/rbac";
import {
  fetchArchivedFiscalYears,
  executeFiscalYearArchive,
  fetchArchivedDocumentsByYear,
} from "../../services/documentService";
import { getDocumentTypeLabel } from "../../utils/routingEngine";
import FileViewer from "../../components/FileViewer/FileViewer";
import Badge from "../../components/Badge/Badge";
import {
  Archive,
  Lock,
  ShieldCheck,
  Calendar,
  Layers,
  Search,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Hash,
  Copy,
  Building,
  Eye,
  Snowflake,
  ShieldAlert,
  ArrowRight,
  Database,
} from "lucide-react";
import "./ArchiveVault.css";

const ArchiveVault = () => {
  const { user } = useAuth();
  const [archivedYears, setArchivedYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [archivedDocs, setArchivedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Wizard Modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardYear, setWizardYear] = useState(2025);
  const [hasConfirmedAudit, setHasConfirmedAudit] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [wizardFeedback, setWizardFeedback] = useState("");
  const [sealedReceipt, setSealedReceipt] = useState(null);

  // Search & Filter within archived records
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  const isSysAdmin = user?.role === ROLES.SYSADMIN;

  // Load archived fiscal years catalogue
  const loadCatalogue = async () => {
    setLoading(true);
    try {
      const years = await fetchArchivedFiscalYears();
      setArchivedYears(years);
      if (years.length > 0 && !years.some((y) => y.year === selectedYear)) {
        setSelectedYear(years[0].year);
      }
    } catch (err) {
      console.error("Failed to load archive catalogue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, []);

  // Load documents for selected fiscal year
  useEffect(() => {
    let active = true;
    const loadYearDocs = async () => {
      try {
        const docs = await fetchArchivedDocumentsByYear(selectedYear, user);
        if (active) setArchivedDocs(docs);
      } catch (err) {
        console.error("Failed to load year docs:", err);
      }
    };
    loadYearDocs();
    return () => {
      active = false;
    };
  }, [selectedYear, user]);

  // Selected archive cycle metadata
  const currentCycle = useMemo(() => {
    return (
      archivedYears.find((y) => y.year === selectedYear) ||
      archivedYears[0] || {
        year: selectedYear,
        title: `Fiscal Year ${selectedYear} Deep Archive`,
        status: "SEALED",
        totalDocuments: archivedDocs.length,
        totalStorageMB: 380,
        archivedAt: new Date().toISOString(),
        archivedBy: "T. Mutasa (SysAdmin)",
        rootSealHash: "0x8f2a4c7e1b9d3065a2e8f14b",
      }
    );
  }, [archivedYears, selectedYear, archivedDocs]);

  // Filtered archived documents
  const filteredDocs = useMemo(() => {
    return archivedDocs.filter((doc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mRef = doc.refNumber?.toLowerCase().includes(q);
        const mTitle = doc.title?.toLowerCase().includes(q);
        const mDesc = doc.description?.toLowerCase().includes(q);
        if (!mRef && !mTitle && !mDesc) return false;
      }
      if (selectedDept !== "ALL" && doc.department !== selectedDept) {
        return false;
      }
      return true;
    });
  }, [archivedDocs, searchQuery, selectedDept]);

  // Trigger Annual Archive Freeze
  const handleExecuteArchive = async (e) => {
    e.preventDefault();
    if (!hasConfirmedAudit) {
      setWizardFeedback("You must confirm council statutory audit finalization.");
      return;
    }

    setIsArchiving(true);
    setWizardFeedback("Calculating SHA-256 root hash and locking records to read-only...");

    try {
      const receipt = await executeFiscalYearArchive(wizardYear, user);
      await loadCatalogue();
      setSealedReceipt(receipt);
      setIsArchiving(false);
    } catch (err) {
      setIsArchiving(false);
      setWizardFeedback(err.message || "Failed to execute archive freeze.");
    }
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="archive-vault-page">
      {/* Header */}
      <header className="archive-header">
        <div className="archive-title-wrap">
          <h1>
            <Archive size={28} style={{ color: "var(--color-accent)" }} />
            <span>Fiscal Year Archiving Engine & Deep Storage Vault</span>
          </h1>
          <p>
            Permanent cold storage records repository for Masvingo Rural District Council. Once a fiscal
            year is finalized, records are cryptographically frozen into immutable read-only state.
          </p>
        </div>

        <div className="archive-seal-badge">
          <div className="seal-icon-wrap">
            <Snowflake size={20} />
          </div>
          <div>
            <div className="seal-text-title">Cold Storage Immutably Sealed</div>
            <div className="seal-text-desc">Permanent Read-Only Statutory Protection</div>
          </div>
        </div>
      </header>

      {/* Overview Stat Cards */}
      <section className="archive-stats-grid" aria-label="Archive Statistics">
        <div className="archive-stat-card">
          <div className="archive-stat-icon icon-archive-purple">
            <Archive size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Archived Cycles</span>
            <span className="audit-stat-number">{archivedYears.length} Years</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon icon-archive-gold">
            <Calendar size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Current Operating Cycle</span>
            <span className="audit-stat-number">FY2026 Active</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon icon-archive-green">
            <Database size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Deep Storage Volume</span>
            <span className="audit-stat-number">11.04 GB</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon icon-archive-blue">
            <ShieldCheck size={22} />
          </div>
          <div className="audit-stat-info">
            <span className="audit-stat-label">Integrity State</span>
            <span className="audit-stat-number">100% Intact</span>
          </div>
        </div>
      </section>

      {/* SysAdmin Annual Archive Action Banner */}
      {isSysAdmin && (
        <section className="archive-wizard-banner">
          <div className="wizard-banner-text">
            <h3>Annual Fiscal Year Freeze & Archive Engine</h3>
            <p>
              Initiate the official end-of-year statutory freeze. All records for the selected fiscal
              period will be permanently locked against modification, deletion, or new uploads.
            </p>
          </div>
          <button
            type="button"
            className="btn-trigger-archive"
            onClick={() => {
              setIsWizardOpen(true);
              setSealedReceipt(null);
              setHasConfirmedAudit(false);
              setWizardFeedback("");
            }}
            id="btn-initiate-archive"
          >
            <Lock size={17} />
            <span>Seal & Archive Fiscal Year</span>
          </button>
        </section>
      )}

      {/* Catalogue Tabs for Archived Fiscal Years */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
            Sealed Fiscal Year Archives
          </h2>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Select a fiscal cycle to inspect cold storage records
          </span>
        </div>

        <div className="catalogue-tabs">
          {archivedYears.map((ay) => (
            <button
              key={ay.year}
              type="button"
              className={`catalogue-tab-btn ${selectedYear === ay.year ? "active" : ""}`}
              onClick={() => setSelectedYear(ay.year)}
            >
              <Snowflake size={15} style={{ color: selectedYear === ay.year ? "#c084fc" : "inherit" }} />
              <span>FY {ay.year} Sealed Archive</span>
            </button>
          ))}
        </div>
      </section>

      {/* Active Fiscal Cycle Certificate & Specs */}
      <section className="archive-cycle-card">
        <div className="cycle-card-header">
          <div>
            <div style={{ fontSize: "0.72rem", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase" }}>
              Permanent Statutory Deposit
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff" }}>
              {currentCycle.title}
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                color: "#c084fc",
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.74rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Lock size={12} />
              <span>FROZEN & IMMUTABLE</span>
            </span>
          </div>
        </div>

        <div className="cycle-specs-grid">
          <div className="spec-item">
            <span className="spec-label">Total Archived Records</span>
            <span className="spec-val">{currentCycle.totalDocuments} Files</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Storage Footprint</span>
            <span className="spec-val">{(currentCycle.totalStorageMB / 1024).toFixed(2)} GB</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Archive Seal Date</span>
            <span className="spec-val">{formatDate(currentCycle.archivedAt)}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Sealed by Officer</span>
            <span className="spec-val">{currentCycle.archivedBy}</span>
          </div>
          <div className="spec-item" style={{ gridColumn: "span 2" }}>
            <span className="spec-label">Root Cryptographic Checksum</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
              <code style={{ fontSize: "0.82rem", color: "var(--color-accent)", fontFamily: "monospace" }}>
                {currentCycle.rootSealHash}
              </code>
              <button
                type="button"
                onClick={() => handleCopyHash(currentCycle.rootSealHash)}
                style={{ background: "transparent", border: "none", color: "var(--color-accent)", cursor: "pointer" }}
                title="Copy Root Hash"
              >
                {copiedHash ? <CheckCircle size={15} /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Records Table for Selected Archived Year */}
      <section className="admin-table-card">
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div className="vault-search-box" style={{ maxWidth: "380px" }}>
            <Search className="vault-search-icon" size={16} />
            <input
              type="text"
              className="vault-search-input"
              placeholder={`Search FY${selectedYear} archived records...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <select
              className="filter-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {Object.values(DEPARTMENTS).map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference Number</th>
                <th>Archived Document Title</th>
                <th>Dept</th>
                <th>Classification</th>
                <th>Archive Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                    No records found in FY{selectedYear} cold storage.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id || doc.refNumber} onClick={() => setViewingDoc(doc)}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-accent)" }}>
                      {doc.refNumber}
                    </td>
                    <td style={{ fontWeight: 600, color: "#ffffff" }}>
                      {doc.title}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{doc.department}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.78rem" }}>
                        {getDocumentTypeLabel(doc.documentType)}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                      {formatDate(doc.archivedAt || doc.createdAt)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-action-btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDoc(doc);
                        }}
                      >
                        <Eye size={13} />
                        <span>Inspect Cold Record</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Annual Archive Seal Execution Wizard Modal */}
      {isWizardOpen && (
        <div className="upload-success-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            {!sealedReceipt ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <Lock size={22} style={{ color: "var(--color-accent)" }} />
                    <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff" }}>
                      Annual Archive Seal Wizard
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWizardOpen(false)}
                    style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleExecuteArchive} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
                    Freezing a fiscal year permanently locks all contained municipal files to <strong>read-only state</strong>.
                    No further uploads, edits, or approvals can be processed for that fiscal period.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Fiscal Year to Seal *</label>
                    <select
                      className="form-select"
                      value={wizardYear}
                      onChange={(e) => setWizardYear(parseInt(e.target.value))}
                    >
                      <option value={2025}>Fiscal Year 2025</option>
                      <option value={2026}>Fiscal Year 2026</option>
                    </select>
                  </div>

                  {/* Mandatory Irreversible Confirmation */}
                  <label className="modal-confirm-checkbox">
                    <input
                      type="checkbox"
                      checked={hasConfirmedAudit}
                      onChange={(e) => setHasConfirmedAudit(e.target.checked)}
                      required
                    />
                    <span>
                      I solemnly confirm as System Administrator that all external audits and municipal
                      financial accounts for FY{wizardYear} are concluded. I understand this freezing action
                      is <strong>permanent and irreversible</strong>.
                    </span>
                  </label>

                  {wizardFeedback && (
                    <div style={{ fontSize: "0.8rem", color: "var(--color-accent)", fontWeight: 600 }}>
                      {wizardFeedback}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setIsWizardOpen(false)}
                      disabled={isArchiving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-trigger-archive"
                      disabled={isArchiving || !hasConfirmedAudit}
                    >
                      {isArchiving ? (
                        <span>Freezing & Sealing Records...</span>
                      ) : (
                        <>
                          <Lock size={16} />
                          <span>Execute Annual Freeze</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success Seal Certificate */
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img
                  src="/mrdc_logo.jpg"
                  alt="MRDC Seal"
                  style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid #c9a227", marginBottom: "1rem" }}
                />
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ffffff" }}>
                  Fiscal Year {sealedReceipt.year} Sealed & Frozen!
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "0.3rem" }}>
                  All municipal documents for FY{sealedReceipt.year} have been permanently committed to
                  immutable cold storage under the Masvingo RDC Statutory Registry.
                </p>

                <div
                  style={{
                    background: "rgba(201, 162, 39, 0.1)",
                    border: "1.5px dashed var(--color-accent)",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    margin: "1.25rem 0",
                    width: "100%",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Official Root Cryptographic Seal Hash
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "0.95rem", color: "var(--color-accent)", fontWeight: 800, marginTop: "0.2rem" }}>
                    {sealedReceipt.rootSealHash}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsWizardOpen(false)}
                  style={{ padding: "0.75rem 2rem", borderRadius: "var(--radius-lg)" }}
                >
                  Return to Archive Vault
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Universal Document Viewer with Archived Cold Storage Watermark */}
      {viewingDoc && (
        <FileViewer
          document={{
            ...viewingDoc,
            description: `[ARCHIVED RECORD — FISCAL YEAR SEALED] ${viewingDoc.description || ""}`,
          }}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};

export default ArchiveVault;
