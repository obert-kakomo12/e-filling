// Masvingo Rural District Council — Dedicated Approvals & Clearance Queue Page
import React from "react";
import { ApprovalPanel } from "../../components/ApprovalPanel/ApprovalPanel";
import { Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "./Approvals.css";

export const Approvals = () => {
  return (
    <div className="approvals-page">
      <header className="approvals-page-header">
        <div className="approvals-page-title-wrap">
          <div className="approvals-page-badge">
            Section 11 Executive Clearance
          </div>
          <h1 className="approvals-page-title">
            Executive Document Approval & Clearance Queue
          </h1>
          <p className="approvals-page-subtitle">
            Formal administrative review queue for reviewing, approving, or issuing rejection bounce-backs on departmental submissions prior to official vault publication.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="btn btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </header>

      {/* Full Approval Panel Component */}
      <ApprovalPanel />
    </div>
  );
};

export default Approvals;
