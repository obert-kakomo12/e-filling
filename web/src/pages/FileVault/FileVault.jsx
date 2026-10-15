// Masvingo Rural District Council — Official File Vault
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  DEPARTMENTS,
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  ROLES,
  hasPermission,
} from "../../utils/rbac";
import {
  ROUTING_CATEGORIES,
  getDocumentTypeLabel,
} from "../../utils/routingEngine";
import {
  fetchUserDocuments,
  approveDocument,
  rejectDocument,
  publishDocument,
} from "../../services/documentService";
import DocumentCard from "../../components/DocumentCard/DocumentCard";
import Badge from "../../components/Badge/Badge";
import FileViewer from "../../components/FileViewer/FileViewer";
import {
  FolderLock,
  Search,
  X,
  Filter,
  Grid,
  List,
  Calendar,
  Building,
  User,
  GitFork,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Share2,
  Copy,
  Clock,
  Lock,
  RotateCcw,
  Tag,
  Shield,
  Layers,
} from "lucide-react";
import "./FileVault.css";

const FileVault = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [copiedRef, setCopiedRef] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  // Keep search state in sync with URL
  useEffect(() => {
    const urlQuery = searchParams.get("search");
    if (urlQuery !== null && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  // Load documents
  useEffect(() => {
    let active = true;
    const loadVault = async () => {
      setLoading(true);
      try {
        const docs = await fetchUserDocuments(user);
        if (active) setDocuments(docs);
      } catch (err) {
        console.error("Failed to load documents:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadVault();
    return () => {
      active = false;
    };
  }, [user]);

  // Filter and Sort Engine
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        // 1. Text Search (Ref, Title, Description, Tags, Uploader)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesRef = doc.refNumber?.toLowerCase().includes(q);
          const matchesTitle = doc.title?.toLowerCase().includes(q);
          const matchesDesc = doc.description?.toLowerCase().includes(q);
          const matchesUploader = doc.uploaderName?.toLowerCase().includes(q);
          const matchesTag = doc.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchesRef && !matchesTitle && !matchesDesc && !matchesUploader && !matchesTag) {
            return false;
          }
        }

        // 2. Department Filter
        if (selectedDept !== "ALL") {
          const isInDept =
            doc.department === selectedDept ||
            (doc.routedTo && doc.routedTo.includes(selectedDept));
          if (!isInDept) return false;
        }

        // 3. Status Filter
        if (selectedStatus !== "ALL" && doc.status !== selectedStatus) {
          return false;
        }

        // 4. Category Filter
        if (selectedCategory !== "ALL" && doc.category !== selectedCategory) {
          return false;
        }

        // 5. Fiscal Year Filter
        if (selectedYear !== "ALL" && String(doc.fiscalYear) !== selectedYear) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortBy === "ref") {
          return (a.refNumber || "").localeCompare(b.refNumber || "");
        }
        return 0;
      });
  }, [documents, searchQuery, selectedDept, selectedStatus, selectedCategory, selectedYear, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDept("ALL");
    setSelectedStatus("ALL");
    setSelectedCategory("ALL");
    setSelectedYear("ALL");
    setSortBy("newest");
    setSearchParams({});
  };

  const handleCopyRef = (ref) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Approval actions
  const handleApprove = async (docId) => {
    try {
      await approveDocument(docId, user);
      // Update local state
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: DOCUMENT_STATUS.APPROVED } : d))
      );
      if (selectedDoc?.id === docId) {
        setSelectedDoc((prev) => ({ ...prev, status: DOCUMENT_STATUS.APPROVED }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePublish = async (docId) => {
    try {
      await publishDocument(docId, user);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: DOCUMENT_STATUS.PUBLISHED } : d))
      );
      if (selectedDoc?.id === docId) {
        setSelectedDoc((prev) => ({ ...prev, status: DOCUMENT_STATUS.PUBLISHED }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="file-vault-container">
      {/* Header & Role Clearance Level */}
      <header className="vault-header">
        <div className="vault-title-wrap">
          <h1>
            <span>Official Council File Vault</span>
          </h1>
          <p>
            Central electronic archives for Masvingo Rural District Council. Search by MRDC reference,
            metadata tags, or origin department.
          </p>
        </div>

        <div className="vault-clearance-pill">
          <span>
            {user?.role === "councilor"
              ? "Governance View: Published Council Records Only"
              : user?.role === "external_auditor"
              ? "Auditor View: Approved Financial Vouchers Only"
              : user?.role === "ceo"
              ? "CEO Tier: Full Executive Council Clearance"
              : user?.role === "sysadmin"
              ? "SysAdmin Tier: Master Archive Oversight"
              : `Department Workspace: ${user?.department || "ADM"}`}
          </span>
        </div>
      </header>

      {/* Toolbar: Search, Filters & View Toggles */}
      <section className="vault-toolbar" aria-label="Vault Search and Filters">
        {/* Row 1: Search Input & View Toggles */}
        <div className="vault-search-row">
          <div className="vault-search-box">
            <Search className="vault-search-icon" size={18} />
            <input
              type="text"
              className="vault-search-input"
              placeholder="Search by reference (MRDC/...), title, uploader, or tag..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchParams(e.target.value ? { search: e.target.value } : {});
              }}
              id="input-vault-search"
            />
            {searchQuery && (
              <button
                type="button"
                className="vault-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setSearchParams({});
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="vault-view-toggles">
            <button
              type="button"
              className={`vault-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
              aria-label="Grid View"
            >
              <Grid size={18} />
            </button>
            <button
              type="button"
              className={`vault-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
              aria-label="Table View"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Row 2: Filter Selectors */}
        <div className="vault-filters-row">
          {/* Department Filter */}
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

          {/* Status Filter */}
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All States</option>
            <option value={DOCUMENT_STATUS.DRAFT}>Draft / Under Review</option>
            <option value={DOCUMENT_STATUS.PENDING}>Pending Approval</option>
            <option value={DOCUMENT_STATUS.APPROVED}>Approved</option>
            <option value={DOCUMENT_STATUS.PUBLISHED}>Published</option>
            <option value={DOCUMENT_STATUS.ARCHIVED}>Archived</option>
          </select>

          {/* Category Filter */}
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {Object.values(ROUTING_CATEGORIES).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Fiscal Year Filter */}
          <select
            className="filter-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="ALL">All Fiscal Years</option>
            <option value="2026">FY 2026</option>
            <option value="2025">FY 2025</option>
            <option value="2024">FY 2024</option>
          </select>

          {/* Sort By */}
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="title">Sort: Title (A-Z)</option>
            <option value="ref">Sort: Reference Number</option>
          </select>

          {(searchQuery ||
            selectedDept !== "ALL" ||
            selectedStatus !== "ALL" ||
            selectedCategory !== "ALL" ||
            selectedYear !== "ALL") && (
            <button
              type="button"
              className="vault-reset-filters-btn"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}

          <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Showing <strong>{filteredDocuments.length}</strong> of <strong>{documents.length}</strong> records
          </div>
        </div>
      </section>

      {/* Main Content: Grid or Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
            Scanning MRDC Vault Index...
          </p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="vault-empty-state">
          <h3 style={{ fontSize: "1.1rem", color: "#ffffff", fontWeight: 700 }}>
            No Matching Records Found
          </h3>
          <p style={{ maxWidth: "420px", fontSize: "0.85rem", lineHeight: 1.5 }}>
            No council documents match your filter criteria or security clearance tier. Try resetting
            your filters or uploading a new file in the Upload Room.
          </p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleResetFilters}
            style={{ marginTop: "0.5rem" }}
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="vault-grid">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id || doc.refNumber}
              document={doc}
              onClick={() => setSelectedDoc(doc)}
            />
          ))}
        </div>
      ) : (
        /* Table / List View */
        <div className="vault-table-wrapper">
          <table className="vault-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Document Title</th>
                <th>Dept</th>
                <th>Category</th>
                <th>Classification</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id || doc.refNumber} onClick={() => setSelectedDoc(doc)}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-accent)" }}>
                    {doc.refNumber}
                  </td>
                  <td style={{ fontWeight: 600, maxWidth: "260px" }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {doc.title}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{doc.department}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      {ROUTING_CATEGORIES[doc.category?.toUpperCase()]?.name || doc.category || "Standard"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.75rem" }}>
                      {getDocumentTypeLabel(doc.documentType)}
                    </span>
                  </td>
                  <td>
                    <Badge type="status" value={doc.status} />
                  </td>
                  <td style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    {formatDate(doc.createdAt)}
                  </td>
                  <td>
                    <button
                      type="button"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "var(--color-accent)",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(doc);
                      }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Detail Inspector Drawer */}
      {selectedDoc && (
        <div
          className="vault-drawer-overlay"
          onClick={() => setSelectedDoc(null)}
          role="dialog"
          aria-modal="true"
        >
          <aside className="vault-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <header className="drawer-header">
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase" }}>
                  Official Document Inspector
                </span>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff", marginTop: "0.1rem" }}>
                  {selectedDoc.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: "0.4rem",
                }}
              >
                <X size={20} />
              </button>
            </header>

            {/* Drawer Content */}
            <div className="drawer-body">
              {/* Reference Number Box */}
              <div
                style={{
                  background: "rgba(201, 162, 39, 0.1)",
                  border: "1.5px dashed var(--color-accent)",
                  borderRadius: "var(--radius-lg)",
                  padding: "0.85rem 1.1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Official Reference Number
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 800, color: "var(--color-accent)" }}>
                    {selectedDoc.refNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyRef(selectedDoc.refNumber)}
                  style={{ background: "transparent", border: "none", color: "var(--color-accent)", cursor: "pointer" }}
                  title="Copy Reference Number"
                >
                  {copiedRef ? <CheckCircle size={18} /> : <Copy size={18} />}
                </button>
              </div>

              {/* Status & Category */}
              <div>
                <div className="drawer-section-title">Workflow State & Classification</div>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                  <Badge type="status" value={selectedDoc.status} />
                  <span
                    style={{
                      background: "rgba(26, 58, 92, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#f8fafc",
                    }}
                  >
                    Category: {ROUTING_CATEGORIES[selectedDoc.category?.toUpperCase()]?.name || selectedDoc.category || "Standard"}
                  </span>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.75rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Type: {getDocumentTypeLabel(selectedDoc.documentType)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedDoc.description && (
                <div>
                  <div className="drawer-section-title">Executive Summary</div>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
                    {selectedDoc.description}
                  </p>
                </div>
              )}

              {/* Department & Routed Targets */}
              <div>
                <div className="drawer-section-title">Departmental Workspaces</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                    Originating Department: <strong>{selectedDoc.department}</strong>
                  </div>
                  {selectedDoc.routedTo && selectedDoc.routedTo.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Mirrored Access:
                      </span>
                      {selectedDoc.routedTo.map((code) => (
                        <span
                          key={code}
                          style={{
                            background: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            color: "#34d399",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lifecycle Audit Timestamps */}
              <div>
                <div className="drawer-section-title">Ingestion & Audit Register</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                  <div>Uploaded by: <strong>{selectedDoc.uploaderName || "Council Officer"}</strong></div>
                  <div>Ingestion Date: <strong>{formatDate(selectedDoc.createdAt)}</strong></div>
                  <div>Fiscal Year: <strong>FY{selectedDoc.fiscalYear || "2026"}</strong></div>
                  {selectedDoc.approvedBy && (
                    <div>
                      Approved by: <strong>{selectedDoc.approverName || "Director"}</strong> on{" "}
                      {formatDate(selectedDoc.approvedAt)}
                    </div>
                  )}
                  {selectedDoc.publishedAt && (
                    <div>Published on: <strong>{formatDate(selectedDoc.publishedAt)}</strong></div>
                  )}
                </div>
              </div>

              {/* File Technical Specifications */}
              <div>
                <div className="drawer-section-title">Digital Asset File Specs</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                  <div>File Name: <strong>{selectedDoc.fileName || selectedDoc.title}</strong></div>
                  <div>File Size: <strong>{formatFileSize(selectedDoc.fileSize)}</strong></div>
                  <div>Version: <strong>v{selectedDoc.version || 1}.0</strong></div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <footer className="drawer-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setViewingDoc(selectedDoc)}
                style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
              >
                <Eye size={16} />
                <span>Open in Secure Viewer</span>
              </button>

              {/* HOD / CEO Approval Trigger */}
              {hasPermission(user?.role, "canApprove") &&
                selectedDoc.status === DOCUMENT_STATUS.PENDING && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => handleApprove(selectedDoc.id)}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <CheckCircle size={16} />
                    <span>Approve</span>
                  </button>
                )}

              {/* Publish to Councilor Portal Trigger */}
              {(user?.role === ROLES.SYSADMIN || user?.role === ROLES.CEO) &&
                selectedDoc.status === DOCUMENT_STATUS.APPROVED && (
                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={() => handlePublish(selectedDoc.id)}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <Share2 size={16} />
                    <span>Publish to Councilors</span>
                  </button>
                )}
            </footer>
          </aside>
        </div>
      )}

      {/* Universal Document Viewer Modal with Dynamic Security Watermark */}
      {viewingDoc && (
        <FileViewer
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};

export default FileVault;
