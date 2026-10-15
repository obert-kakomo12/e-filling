import React from "react";
import "./Badge.css";

const ROLE_LABELS = {
  sysadmin: "SysAdmin",
  ceo: "CEO",
  hod: "Director / HOD",
  specialized_officer: "Specialized Officer",
  clerk: "Registry Clerk",
  auditor: "Internal Auditor",
  councilor: "Councilor",
  external_auditor: "External Auditor",
};

export const Badge = ({ type = "status", value, withDot = true, className = "" }) => {
  if (!value) return null;

  const normalizedValue = value.toLowerCase();
  let badgeClass = `mrdc-badge mrdc-badge-${normalizedValue} ${className}`;
  let displayLabel = value;

  if (type === "role") {
    displayLabel = ROLE_LABELS[normalizedValue] || value;
  } else if (type === "status") {
    displayLabel = value.replace("_", " ").toUpperCase();
  }

  return (
    <span className={badgeClass}>
      {withDot && <span className="mrdc-badge-dot" />}
      <span>{displayLabel}</span>
    </span>
  );
};

export default Badge;
