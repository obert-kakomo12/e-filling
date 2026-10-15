// Masvingo Rural District Council — Dedicated Routing Engine & RBAC Matrix Page
import React from "react";
import RoutingInspector from "../../components/RoutingInspector/RoutingInspector";
import { GitFork, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "./RoutingEngine.css";

export const RoutingEngine = () => {
  return (
    <div className="routing-engine-page">
      <header className="routing-page-header">
        <div className="routing-page-title-wrap">
          <div className="routing-page-badge">
            <GitFork size={15} /> Section 4 Routing Infrastructure
          </div>
          <h1 className="routing-page-title">
            Document Routing Engine & Category Matrix
          </h1>
          <p className="routing-page-subtitle">
            Simulate and verify automated departmental routing pipelines, actionable notification triggers, and RBAC visibility clearance across all 8 official MRDC roles.
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

      {/* Full Routing Inspector Component */}
      <RoutingInspector />
    </div>
  );
};

export default RoutingEngine;
