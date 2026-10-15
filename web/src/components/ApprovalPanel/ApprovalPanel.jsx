// Masvingo Rural District Council — HOD & Director Approval Workflow Engine
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { DOCUMENT_STATUS, ROLES, hasPermission } from "../../utils/rbac";
import {
  fetchUserDocuments,
  approveDocument,
  rejectDocument,
  publishDocument,
} from "../../services/documentService";
import FileViewer from "../FileViewer/FileViewer";
import Badge from "../Badge/Badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Share2,
  FileText,
  User,
  Building,
  Check,
  X,
  Lock,
  ArrowRight,
} from "lucide-react";
import "./ApprovalPanel.css";

export const ApprovalPanel = ({ onDocumentApproved }) => {
  const { user } = useAuth();
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [feedback, setFeedback] = useState("");

  // Rejection modal state
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canApprove = hasPermission(user?.role, "canApprove") || user?.role === ROLES.CEO;

  const loadPending = async () => {
    setLoading(true);
    try {
      const all = await fetchUserDocuments(user);
      const pending = all.filter((d) => d.status === DOCUMENT_STATUS.PENDING);
      setPendingDocs(pending);
    } catch (err) {
      console.error("Failed to load pending queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, [user]);

  const handleApprove = async (doc) => {
    try {
      await approveDocument(doc.id, user);
      setPendingDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setFeedback(`Approved "${doc.title}" [${doc.refNumber}] ✓`);
      setTimeout(() => setFeedback(""), 3500);
      onDocumentApproved?.(doc);
    } catch (err) {
      alert("Approval error: " + err.message);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionNotes.trim()) {
      alert("Rejection notes explaining the deficiency are mandatory.");
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectDocument(rejectingDoc.id, user, rejectionNotes.trim());
      setPendingDocs((prev) => prev.filter((d) => d.id !== rejectingDoc.id));
      setRejectingDoc(null);
      setRejectionNotes("");
      setFeedback(`Rejected "${rejectingDoc.title}" — notes returned to uploader.`);
      setTimeout(() => setFeedback(""), 3500);
    } catch (err) {
      alert("Rejection error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canApprove) {
    return null; // Only directors, HODs, CEO, and SysAdmin see the Approval Engine
  }

  return (
    <section className="approval-panel-container" aria-label="Director Approval Workflow Engine">
      {/* Header */}
      <div className="approval-header">
        <div className="approval-title-wrap">
          <h3>Director & HOD Approval Queue</h3>
          <span className="approval-count-badge">
            {pendingDocs.length} Pending Decision
          </span>
        </div>

        {feedback && (
          <div style={{ fontSize: "0.82rem", color: "#34d399", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Check size={16} />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Queue Items */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "1.5rem" }}>
          <div className="spinner" style={{ margin: "0 auto 0.5rem" }} />
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Scanning Department Pending Submissions...
          </span>
        </div>
      ) : pendingDocs.length === 0 ? (
        <div className="approval-empty">
          <CheckCircle size={32} style={{ color: "#34d399", opacity: 0.8 }} />
          <span style={{ fontWeight: 700, color: "#ffffff", fontSize: "0.95rem" }}>
            All Submissions Clear
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            No documents are currently awaiting your departmental review or signature.
          </span>
        </div>
      ) : (
        <div className="approval-items-list">
          {pendingDocs.map((doc) => (
            <article key={doc.id || doc.refNumber} className="approval-card">
              <div className="approval-doc-info">
                <div className="approval-text-details">
                  <h4 className="approval-doc-title">{doc.title}</h4>
                  <div className="approval-meta-row">
                    <span className="approval-ref-pill">{doc.refNumber}</span>
                    <span>Dept: <strong>{doc.department}</strong></span>
                    <span>•</span>
                    <span>Uploader: <strong>{doc.uploaderName}</strong></span>
                    <span>•</span>
                    <Badge type="status" value={doc.category} />
                  </div>
                  {doc.description && (
                    <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "0.2rem", lineHeight: 1.4 }}>
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="approval-actions-group">
                <button
                  type="button"
                  className="btn-inspect-small"
                  onClick={() => setViewingDoc(doc)}
                  title="Inspect document before decision"
                >
                  <Eye size={14} />
                  <span>Inspect</span>
                </button>

                <button
                  type="button"
                  className="btn-approve"
                  onClick={() => handleApprove(doc)}
                  title="Approve document into Official Vault"
                >
                  <CheckCircle size={15} />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  className="btn-reject"
                  onClick={() => {
                    setRejectingDoc(doc);
                    setRejectionNotes("");
                  }}
                  title="Bounce back with mandatory rejection notes"
                >
                  <XCircle size={15} />
                  <span>Reject</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Rejection Justification Modal */}
      {rejectingDoc && (
        <div className="upload-success-overlay" role="dialog" aria-modal="true">
          <div className="rejection-modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <AlertTriangle size={22} style={{ color: "#f87171" }} />
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff" }}>
                  Document Rejection & Bounce-Back
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingDoc(null)}
                style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#f8fafc" }}>
                You are rejecting <strong>"{rejectingDoc.title}"</strong> [<code>{rejectingDoc.refNumber}</code>].
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: "#fca5a5" }}>
                  Mandatory Rejection Justification & Feedback *
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="State clearly what corrections are required by the compiling clerk (e.g. Missing contractor tax clearance, arithmetic discrepancy in milestone bill)..."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setRejectingDoc(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isSubmitting || !rejectionNotes.trim()}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <XCircle size={16} />
                  <span>Confirm Rejection & Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal during inspection */}
      {viewingDoc && (
        <FileViewer
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </section>
  );
};

export default ApprovalPanel;
