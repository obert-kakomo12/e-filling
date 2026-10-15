// Masvingo Rural District Council — Upload Room
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  DEPARTMENTS,
  DOCUMENT_TYPES,
  ROLES,
} from "../../utils/rbac";
import {
  ROUTING_CATEGORIES,
  ACTION_FLAGS,
  computeRoutingTargets,
  getNotificationTargets,
  getDocumentTypeLabel,
} from "../../utils/routingEngine";
import {
  generateRefNumber,
  getCurrentFiscalYear,
} from "../../utils/referenceGen";
import {
  createDocument,
  validateFile,
} from "../../services/documentService";
import Badge from "../../components/Badge/Badge";
import {
  UploadCloud,
  FileText,
  FileCheck,
  FileSpreadsheet,
  Image as ImageIcon,
  AlertTriangle,
  X,
  CheckCircle,
  Copy,
  ArrowRight,
  ShieldAlert,
  GitFork,
  Tag,
  Lock,
  Building,
  Layers,
  Sparkles,
} from "lucide-react";
import "./UploadRoom.css";

const UploadRoom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState(user?.department || "ADM");
  const [category, setCategory] = useState("upward_operational");
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES.OPERATIONAL_REPORT);
  const [actionFlags, setActionFlags] = useState([]);
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState([]);

  // Upload & Sequence State
  const [predictedRef, setPredictedRef] = useState("MRDC/.../.../...");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const fiscalYear = getCurrentFiscalYear();

  // Keep department in sync if user changes
  useEffect(() => {
    if (user?.department && user.role !== ROLES.SYSADMIN) {
      setDepartment(user.department);
    }
  }, [user]);

  // Compute live predicted reference number
  useEffect(() => {
    let active = true;
    const fetchRef = async () => {
      try {
        const ref = await generateRefNumber(department, fiscalYear);
        if (active) setPredictedRef(ref);
      } catch (e) {
        if (active) setPredictedRef(`MRDC/${department}/${fiscalYear}/001`);
      }
    };
    fetchRef();
    return () => {
      active = false;
    };
  }, [department, fiscalYear]);

  // Live routing preview calculation
  const liveRouting = useMemo(() => {
    const targets = computeRoutingTargets(department, documentType, category, actionFlags);
    const notifications = getNotificationTargets(department, documentType, category, actionFlags);
    return {
      targets: targets.map((c) => DEPARTMENTS[c] || { code: c, name: c }),
      notifications,
    };
  }, [department, documentType, category, actionFlags]);

  // File Handlers
  const handleFileSelection = (file) => {
    setFileError("");
    try {
      validateFile(file);
      setSelectedFile(file);
      if (!title) {
        // Pre-fill title without extension
        const cleanName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        setTitle(cleanName.replace(/[-_]/g, " "));
      }
    } catch (err) {
      setFileError(err.message);
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagsInput.trim().replace(/^,|,$/g, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagsInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const toggleActionFlag = (flagId) => {
    setActionFlags((prev) =>
      prev.includes(flagId) ? prev.filter((id) => id !== flagId) : [...prev, flagId]
    );
  };

  // Upload Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError("Please select a document file to upload.");
      return;
    }
    if (!title.trim()) {
      setFileError("Please enter an official document title.");
      return;
    }

    setFileError("");
    setIsUploading(true);
    setUploadProgress(10);
    setUploadStage("Computing cryptographic reference & validating 15MB limit...");

    try {
      const docRecord = await createDocument({
        file: selectedFile,
        title: title.trim(),
        department,
        documentType,
        category,
        actionFlags,
        tags,
        uploadedBy: user,
        description: description.trim(),
        onProgress: (pct) => {
          setUploadProgress(pct);
          if (pct < 40) setUploadStage("Uploading document chunks...");
          else if (pct < 80) setUploadStage("Executing Intelligent Routing Rules...");
          else setUploadStage("Registering in MRDC Immutable Audit Trail...");
        },
      });

      setUploadProgress(100);
      setUploadStage("Document officially sealed!");
      setUploadedDoc(docRecord);
    } catch (err) {
      console.error("Upload error:", err);
      setFileError(err.message || "Failed to upload document. Please check network/storage.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyRef = () => {
    if (uploadedDoc?.refNumber) {
      navigator.clipboard.writeText(uploadedDoc.refNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setTitle("");
    setDescription("");
    setTags([]);
    setTagsInput("");
    setUploadedDoc(null);
    setUploadProgress(0);
    setUploadStage("");
    setActionFlags([]);
  };

  const getFileIcon = (type) => {
    if (type?.includes("pdf")) return <FileText size={24} />;
    if (type?.includes("word") || type?.includes("officedocument.word"))
      return <FileCheck size={24} />;
    if (type?.includes("sheet") || type?.includes("excel"))
      return <FileSpreadsheet size={24} />;
    if (type?.includes("image")) return <ImageIcon size={24} />;
    return <FileText size={24} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="upload-room-container">
      {/* Header */}
      <header className="upload-header">
        <div className="upload-title-wrap">
          <h1>
            <UploadCloud size={28} style={{ color: "var(--color-accent)" }} />
            <span>Document Ingestion & Upload Room</span>
          </h1>
          <p>
            Secure intake room for council records. Max 15MB. Automated reference generation,
            metadata classification, and intelligent cross-departmental routing.
          </p>
        </div>

        <div className="upload-meta-badge">
          <Building size={16} style={{ color: "var(--color-accent)" }} />
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>
            Workspace: {department}
          </span>
          <Badge type="role" value={user?.role} />
        </div>
      </header>

      {/* Error alert banner */}
      {fileError && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#fca5a5",
            borderRadius: "var(--radius-lg)",
            padding: "0.9rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
          role="alert"
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "0.88rem" }}>{fileError}</span>
        </div>
      )}

      {/* Main Upload Form Grid */}
      <form onSubmit={handleSubmit} className="upload-form-grid">
        {/* Left Column: Dropzone & File Status */}
        <div className="upload-left-col">
          {/* Predicted Reference Indicator */}
          <div className="ref-number-box">
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                Assigned Official Sequence
              </div>
              <div className="ref-number-val">{predictedRef}</div>
            </div>
            <Lock size={18} style={{ color: "var(--color-accent)" }} />
          </div>

          {/* Drag & Drop Box */}
          {!selectedFile ? (
            <div
              className={`dropzone-box ${isDragActive ? "drag-active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
              />
              <div className="dropzone-icon-wrap">
                <UploadCloud size={32} />
              </div>
              <div className="dropzone-main-text">
                Drag & Drop Document Here
              </div>
              <div className="dropzone-sub-text">
                Supports PDF, Word, Excel, and Images up to 15MB
              </div>
              <button type="button" className="dropzone-browse-btn">
                Browse Files
              </button>

              <div className="dropzone-file-tags">
                <span className="file-format-tag">PDF (Official)</span>
                <span className="file-format-tag">DOC / DOCX</span>
                <span className="file-format-tag">XLS / XLSX</span>
                <span className="file-format-tag">JPG / PNG</span>
                <span className="file-format-tag" style={{ color: "var(--color-accent)" }}>
                  Max 15MB
                </span>
              </div>
            </div>
          ) : (
            <div className="selected-file-card">
              <div className="selected-file-info">
                <div className="file-type-icon">
                  {getFileIcon(selectedFile.type)}
                </div>
                <div className="file-details">
                  <span className="file-name" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <span className="file-size-tag">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || "Document"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="remove-file-btn"
                onClick={() => setSelectedFile(null)}
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Live Routing Distribution Summary */}
          <div className="live-routing-preview-card">
            <div className="routing-preview-header">
              <span>Intelligent Routing Preview ({liveRouting.targets.length} Workspaces)</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", margin: 0 }}>
              Based on Section 4 conditional rules, this document will be instantly mirrored to:
            </p>
            <div className="routing-dept-tags">
              {liveRouting.targets.map((dept) => (
                <span
                  key={dept.code}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    color: "#ffffff",
                    borderRadius: "4px",
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                  }}
                >
                  {dept.code} ({dept.name})
                </span>
              ))}
            </div>

            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
              In-App Alerts: {liveRouting.notifications.map((n) => `${n.role.toUpperCase()} [${n.department}]`).join(", ")}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Classification Form */}
        <div className="upload-right-col">
          <div className="upload-metadata-card">
            {/* Document Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-doc-title">
                Document Title *
              </label>
              <input
                id="input-doc-title"
                type="text"
                className="form-input"
                placeholder="e.g. Road Progress Log — Phase 2 Gutu Corridor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Department (SysAdmin can override, others locked) */}
            <div className="form-group">
              <label className="form-label" htmlFor="select-department">
                Originating Department
              </label>
              <select
                id="select-department"
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={user?.role !== ROLES.SYSADMIN}
              >
                {Object.values(DEPARTMENTS).map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Category Matrix Selector */}
            <div className="form-group">
              <label className="form-label">
                Category Matrix *
              </label>
              <div className="category-pills">
                {Object.values(ROUTING_CATEGORIES).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-pill-btn ${category === cat.id ? "active" : ""}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <span className="category-pill-title">{cat.name}</span>
                    <span className="category-pill-sub">
                      {cat.id === "strictly_confidential"
                        ? "HR/Executive Isolated"
                        : cat.id === "cross_functional"
                        ? "Mirrors to FIN & PMU"
                        : cat.id === "public_council"
                        ? "Councilor Read-Only"
                        : "Upward to HOD & CEO"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Type Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="select-doc-type">
                Document Classification Type *
              </label>
              <select
                id="select-doc-type"
                className="form-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {Object.values(DOCUMENT_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {getDocumentTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Actionable Trigger Flags */}
            <div className="form-group">
              <label className="form-label">
                Actionable Automation Flags
              </label>
              <div className="action-flags-box">
                {Object.values(ACTION_FLAGS).map((flag) => (
                  <label key={flag.id} className="flag-checkbox-label">
                    <input
                      type="checkbox"
                      checked={actionFlags.includes(flag.id)}
                      onChange={() => toggleActionFlag(flag.id)}
                    />
                    <span>{flag.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description / Executive Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-description">
                <span>Executive Summary / Notes</span>
              </label>
              <textarea
                id="input-description"
                className="form-textarea"
                rows={2}
                placeholder="Brief summary for approving Director and audit record..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Tags / Keywords */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-tags">
                <Tag size={14} />
                <span>Search Keywords & Tags (Press Enter)</span>
              </label>
              <input
                id="input-tags"
                type="text"
                className="form-input"
                placeholder="e.g. Q1, budget, infrastructure, borehole"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              {tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
                  {tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: "rgba(201, 162, 39, 0.15)",
                        border: "1px solid rgba(201, 162, 39, 0.35)",
                        color: "var(--color-accent)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <span>#{t}</span>
                      <X
                        size={12}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleRemoveTag(t)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Bar (during submission) */}
            {isUploading && (
              <div className="upload-progress-container">
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                  <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{uploadStage}</span>
                  <span style={{ color: "#ffffff", fontWeight: 700 }}>{uploadProgress}%</span>
                </div>
                <div className="upload-progress-bar-bg">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Ingestion Submit Button */}
            <button
              type="submit"
              className="upload-submit-btn"
              disabled={isUploading || !selectedFile}
              id="btn-upload-submit"
            >
              {isUploading ? (
                <span>Ingesting Council Document...</span>
              ) : (
                <>
                  <UploadCloud size={20} />
                  <span>Seal & Ingest Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Success Modal / Ingestion Receipt */}
      {uploadedDoc && (
        <div className="upload-success-overlay" role="dialog" aria-modal="true">
          <div className="upload-success-modal">
            <img
              src="/mrdc_logo.jpg"
              alt="MRDC Council Seal"
              className="success-seal-img"
            />
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff" }}>
              Document Successfully Ingested!
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", marginTop: "0.35rem" }}>
              The record has been cryptographically cataloged, timestamped, and assigned an official reference number.
            </p>

            {/* Ref Display */}
            <div className="success-ref-display">
              <span>{uploadedDoc.refNumber}</span>
              <button
                type="button"
                onClick={handleCopyRef}
                style={{ background: "transparent", border: "none", color: "var(--color-accent)", cursor: "pointer" }}
                title="Copy reference number"
              >
                {copiedRef ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Title: <strong>{uploadedDoc.title}</strong> • Dept: <strong>{uploadedDoc.department}</strong>
            </div>

            <div style={{ display: "flex", gap: "0.85rem", width: "100%", justifyContent: "center" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={resetUploadForm}
                style={{ padding: "0.75rem 1.25rem", borderRadius: "var(--radius-lg)" }}
              >
                Upload Another
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/vault`)}
                style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span>View in File Vault</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadRoom;
