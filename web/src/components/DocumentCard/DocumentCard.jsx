import React from "react";
import Badge from "../Badge/Badge";
import { Lock } from "lucide-react";
import "./DocumentCard.css";

export const DocumentCard = ({ document, onClick }) => {
  if (!document) return null;

  const {
    refNumber,
    title,
    description,
    department,
    category,
    documentType,
    status,
    fileType,
    fileSize,
    uploaderName,
    createdAt,
    routedTo,
    tags = [],
  } = document;

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return "";
    }
  };

  return (
    <article
      className="doc-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Document: ${title}`}
    >
      <div className="doc-card-top">
        <div className="doc-card-badges">
          <span className="doc-ref-pill">{refNumber}</span>
          <Badge type="status" value={status} />
        </div>
      </div>

      <div className="doc-card-content">
        <h3 className="doc-card-title" title={title}>
          {title}
        </h3>
        {description && <p className="doc-card-desc">{description}</p>}

        {tags && tags.length > 0 && (
          <div className="doc-card-tags">
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="doc-tag-pill">
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="doc-tag-pill">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="doc-card-footer">
        <div className="doc-card-meta-left">
          <span className="doc-dept-badge">{department}</span>
          {category === "strictly_confidential" && (
            <Lock size={12} style={{ color: "var(--color-danger)" }} title="Strictly Confidential" />
          )}
          {routedTo && routedTo.length > 1 && (
            <span style={{ fontSize: "0.72rem", color: "var(--color-accent)", fontWeight: 700 }}>
              {routedTo.length} routes
            </span>
          )}
        </div>

        <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
          {formatDate(createdAt)}
        </div>
      </div>
    </article>
  );
};

export default DocumentCard;
