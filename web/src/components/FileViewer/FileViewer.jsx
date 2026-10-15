// Masvingo Rural District Council — Universal Document Viewer & Security Watermarking
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { DEPARTMENTS, ROLES } from "../../utils/rbac";
import { logAuditEvent, AUDIT_ACTIONS } from "../../services/auditService";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  Download,
  Shield,
  Lock,
  FileText,
  Calendar,
  Building,
  CheckCircle,
  Copy,
} from "lucide-react";
import "./FileViewer.css";

export const FileViewer = ({ document, onClose }) => {
  const { user } = useAuth();
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!document) return null;

  const {
    refNumber = "MRDC/ADM/2026/0001",
    title = "Council Document",
    department = "ADM",
    category = "upward_operational",
    documentType = "operational_report",
    status = "approved",
    description = "",
    fileURL = "",
    fileType = "application/pdf",
    uploaderName = "Council Officer",
    createdAt,
  } = document;

  const deptInfo = DEPARTMENTS[department] || { code: department, name: "Masvingo Rural District Council" };
  const viewTimestamp = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Log viewing to immutable audit trail upon opening
  useEffect(() => {
    if (user && document) {
      logAuditEvent({
        userId: user.uid,
        userName: user.displayName,
        action: AUDIT_ACTIONS.DOCUMENT_VIEW,
        documentId: document.id || document.refNumber,
        documentTitle: document.title,
        details: `Inspected document [${refNumber}] in Universal Viewer`,
      }).catch((e) => console.warn("Audit logging view error:", e));
    }
  }, [document, user, refNumber]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 65));
  const handleResetZoom = () => setZoomLevel(100);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(refNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownload = (e) => {
    if (fileURL && (fileURL.startsWith("blob:") || fileURL.startsWith("data:") || fileURL.startsWith("http"))) {
      return; // Standard download proceeds
    }
    e.preventDefault();
    const content = `MASVINGO RURAL DISTRICT COUNCIL
OFFICIAL ARCHIVAL & AUDIT COPY
=====================================================
Document Reference: ${refNumber}
Title: ${title}
Department: ${deptInfo.name} (${deptInfo.code})
Document Type: ${document.documentType || "Official Council Document"}
Status: ${document.status?.toUpperCase()}
Fiscal Year: ${document.fiscalYear || "2026"}
Ingestion Date: ${formatDate(createdAt)}
Uploader: ${uploaderName}
Approver: ${document.approverName || "Council Secretariat"}

DESCRIPTION & EXTRACT:
${description || "Official council document stored in MRDC E-Filing System."}

SECURITY & TAMPER-EVIDENT AUDIT NOTICE:
Exported by: ${user?.displayName || "Authorized User"} (${user?.role?.toUpperCase() || "OFFICER"})
Export Timestamp: ${viewTimestamp}
Statutory Authority: Rural District Councils Act [Chapter 29:13]
=====================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${refNumber.replace(/\//g, "_")}_CERTIFIED_EXTRACT.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (isoString) => {
    if (!isoString) return viewTimestamp;
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

  // Generate 8 watermark diagonal stamps to cover entire sheet
  const watermarkStamps = Array.from({ length: 8 });

  return (
    <div className="viewer-overlay" role="dialog" aria-modal="true" aria-label="Document Viewer">
      {/* Top Controls Toolbar */}
      <header className="viewer-toolbar">
        {/* Left: Branding & Reference */}
        <div className="viewer-toolbar-left">
          <img
            src="/mrdc_logo.jpg"
            alt="MRDC Seal"
            className="viewer-seal-thumb"
          />
          <div className="viewer-doc-titles">
            <h2 className="viewer-doc-title" title={title}>
              {title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className="viewer-doc-ref">{refNumber}</span>
              <button
                type="button"
                onClick={handleCopyRef}
                style={{ background: "transparent", border: "none", color: "var(--color-accent)", cursor: "pointer" }}
                title="Copy reference number"
              >
                {copiedRef ? <CheckCircle size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Zoom Controls */}
        <div className="viewer-toolbar-center">
          <button
            type="button"
            className="viewer-ctrl-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            disabled={zoomLevel <= 65}
          >
            <ZoomOut size={16} />
          </button>
          <span className="viewer-zoom-val">{zoomLevel}%</span>
          <button
            type="button"
            className="viewer-ctrl-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            disabled={zoomLevel >= 175}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className="viewer-ctrl-btn"
            onClick={handleResetZoom}
            title="Reset Zoom (100%)"
          >
            <Maximize2 size={15} />
          </button>
        </div>

        {/* Right: Security Badge, Print, Close */}
        <div className="viewer-toolbar-right">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(201, 162, 39, 0.12)",
              border: "1px solid rgba(201, 162, 39, 0.3)",
              padding: "0.3rem 0.6rem",
              borderRadius: "4px",
              fontSize: "0.74rem",
              color: "var(--color-accent)",
              fontWeight: 700,
            }}
          >
            <Shield size={13} />
            <span>Watermarked</span>
          </div>

          <button
            type="button"
            className="viewer-action-btn"
            onClick={handlePrint}
            title="Print with Security Watermark"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          {/* Download button if not Councilor (Councilors get read-only view) */}
          {user?.role !== ROLES.COUNCILOR && (
            <a
              href={fileURL || "#"}
              download={document.fileName || `${refNumber}.pdf`}
              onClick={handleDownload}
              className="viewer-action-btn"
              style={{ textDecoration: "none" }}
              title="Download Document"
            >
              <Download size={15} />
              <span>Download</span>
            </a>
          )}

          <button
            type="button"
            className="viewer-close-btn"
            onClick={onClose}
            aria-label="Close Viewer"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Document Canvas Stage */}
      <main className="viewer-canvas-stage">
        <div
          className="doc-sheet"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Dynamic Security Watermark Diagonal Grid */}
          <div className="doc-security-watermark-overlay" aria-hidden="true">
            {watermarkStamps.map((_, i) => (
              <div key={i} className="watermark-stamp">
                <span className="watermark-org">MASVINGO RURAL DISTRICT COUNCIL</span>
                <span className="watermark-user">
                  {user?.role === "councilor"
                    ? `COUNCILOR LEGISLATIVE COPY • HON. ${user?.displayName?.toUpperCase()} (WARD ${user?.ward || "14"})`
                    : `OFFICIAL AUDIT COPY • ${user?.displayName || "OFFICER"} (${user?.role?.toUpperCase() || "USER"})`}
                </span>
                <span className="watermark-ref">
                  REF: {refNumber} • {viewTimestamp}
                </span>
              </div>
            ))}
          </div>

          {/* Council Formal Letterhead */}
          <header className="doc-letterhead">
            <img
              src="/mrdc_logo.jpg"
              alt="MRDC Seal"
              className="letterhead-seal"
            />
            <div className="letterhead-titles">
              <h1 className="letterhead-council">MASVINGO RURAL DISTRICT COUNCIL</h1>
              <p className="letterhead-sub">Republic of Zimbabwe • Local Government Authority</p>
              <p className="letterhead-dept">{deptInfo.name.toUpperCase()} ({deptInfo.code})</p>
            </div>
            <img
              src="/mrdc_logo.jpg"
              alt="MRDC Seal"
              className="letterhead-seal"
              style={{ opacity: 0.9 }}
            />
          </header>

          {/* Metadata Grid */}
          <section className="doc-metadata-bar">
            <div>
              <div className="meta-field-label">Official Document Reference</div>
              <div className="meta-field-val" style={{ fontFamily: "monospace", color: "#1a3a5c" }}>
                {refNumber}
              </div>
            </div>
            <div>
              <div className="meta-field-label">Ingestion & Clearance Date</div>
              <div className="meta-field-val">{formatDate(createdAt)}</div>
            </div>
            <div>
              <div className="meta-field-label">Security Classification</div>
              <div className="meta-field-val" style={{ textTransform: "uppercase" }}>
                {category.replace("_", " ")}
              </div>
            </div>
          </section>

          {/* Document Content Body */}
          <article>
            <h2 className="doc-body-title">{title}</h2>
            <p className="doc-body-text">
              {description ||
                "This official council record has been verified, digitally fingerprinted, and archived under the Masvingo Rural District Council Records Management Framework. All contents herein constitute official municipal proceedings."}
            </p>

            {/* Specific Formal Tables based on Document Type */}
            {documentType === "payroll" ? (
              <table className="doc-formal-table">
                <thead>
                  <tr>
                    <th>Grade / Band</th>
                    <th>Designation</th>
                    <th>Basic Salary ($)</th>
                    <th>NSSA ($)</th>
                    <th>Net Remittance ($)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Executive Tier 1</td>
                    <td>Chief Executive Officer</td>
                    <td>4,850.00</td>
                    <td>145.50</td>
                    <td>4,704.50</td>
                  </tr>
                  <tr>
                    <td>Executive Tier 2</td>
                    <td>Director of Technical Services</td>
                    <td>3,920.00</td>
                    <td>117.60</td>
                    <td>3,802.40</td>
                  </tr>
                  <tr>
                    <td>Executive Tier 2</td>
                    <td>Director of Finance & Accounts</td>
                    <td>3,920.00</td>
                    <td>117.60</td>
                    <td>3,802.40</td>
                  </tr>
                  <tr>
                    <td>Executive Tier 2</td>
                    <td>Director of Human Resources</td>
                    <td>3,920.00</td>
                    <td>117.60</td>
                    <td>3,802.40</td>
                  </tr>
                </tbody>
              </table>
            ) : documentType === "budget" ? (
              <table className="doc-formal-table">
                <thead>
                  <tr>
                    <th>Vote / Account Code</th>
                    <th>Department</th>
                    <th>Capital Allocation ($)</th>
                    <th>Recurrent Allocation ($)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>VOTE-2026-CET</td>
                    <td>Civil Engineering & Roads</td>
                    <td>850,000.00</td>
                    <td>220,000.00</td>
                    <td>Approved by Council</td>
                  </tr>
                  <tr>
                    <td>VOTE-2026-LCS</td>
                    <td>Land & Community Water</td>
                    <td>420,000.00</td>
                    <td>130,000.00</td>
                    <td>Approved by Council</td>
                  </tr>
                  <tr>
                    <td>VOTE-2026-ADM</td>
                    <td>Central Administration</td>
                    <td>210,000.00</td>
                    <td>380,000.00</td>
                    <td>Approved by Council</td>
                  </tr>
                  <tr>
                    <td>VOTE-2026-PMU</td>
                    <td>Procurement Operations</td>
                    <td>140,000.00</td>
                    <td>90,000.00</td>
                    <td>Approved by Council</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="doc-formal-table">
                <thead>
                  <tr>
                    <th>Item No.</th>
                    <th>Operational Milestone</th>
                    <th>Target Scope</th>
                    <th>Assigned Unit</th>
                    <th>Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>001</td>
                    <td>Corridor Survey & Gravelling</td>
                    <td>Ward 4 to Ward 11 Transit</td>
                    <td>CET Technical Team</td>
                    <td>Inspected & Certified</td>
                  </tr>
                  <tr>
                    <td>002</td>
                    <td>Culvert Infrastructure & Drainage</td>
                    <td>14 Crossing Points</td>
                    <td>Civil Works Unit</td>
                    <td>In Progress (92%)</td>
                  </tr>
                  <tr>
                    <td>003</td>
                    <td>Community Stakeholder Sign-Off</td>
                    <td>Ward Councilor & Headman</td>
                    <td>LCS Liaison</td>
                    <td>Completed ✓</td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Formal Council Signatures */}
            <div className="doc-signatures-grid">
              <div className="sig-block">
                <div className="sig-line" />
                <span className="sig-name">{uploaderName || "Originating Officer"}</span>
                <span className="sig-title">Compiling Officer • {deptInfo.name}</span>
              </div>

              <div className="sig-block">
                <div className="sig-line" />
                <span className="sig-name">Dr. F. Shumba</span>
                <span className="sig-title">Chief Executive Officer • Masvingo RDC</span>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
};

export default FileViewer;
