import React, { useState, useMemo } from "react";
import {
  DEPARTMENTS,
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
  ROLES,
} from "../../utils/rbac";
import {
  ROUTING_CATEGORIES,
  ACTION_FLAGS,
  computeRoutingTargets,
  getNotificationTargets,
  evaluateRoutingRules,
  getRoleClearanceMatrix,
  getDocumentTypeLabel,
} from "../../utils/routingEngine";
import Badge from "../Badge/Badge";
import {
  GitFork,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Bell,
  Eye,
  Lock,
  Sparkles,
  Building,
  Check,
} from "lucide-react";
import "./RoutingInspector.css";

const PRESET_SCENARIOS = [
  {
    id: "hr_payroll",
    name: "HR Payroll Report (Strictly Confidential Lock)",
    dept: "HRS",
    category: "strictly_confidential",
    type: DOCUMENT_TYPES.PAYROLL,
    flags: [],
    status: DOCUMENT_STATUS.PENDING,
  },
  {
    id: "road_log",
    name: "Road Progress Log (Upward Operational)",
    dept: "CET",
    category: "upward_operational",
    type: DOCUMENT_TYPES.OPERATIONAL_REPORT,
    flags: [],
    status: DOCUMENT_STATUS.PENDING,
  },
  {
    id: "it_depreciation",
    name: "IT Asset Depreciation (Cross-Functional to FIN & PMU)",
    dept: "ADM",
    category: "cross_functional",
    type: DOCUMENT_TYPES.CROSS_FUNCTIONAL,
    flags: ["hardware_replacement", "budget_allocation"],
    status: DOCUMENT_STATUS.PENDING,
  },
  {
    id: "council_budget",
    name: "Annual Council Budget (Councilor Publication)",
    dept: "FIN",
    category: "public_council",
    type: DOCUMENT_TYPES.BUDGET,
    flags: [],
    status: DOCUMENT_STATUS.PUBLISHED,
  },
];

export const RoutingInspector = () => {
  const [selectedDept, setSelectedDept] = useState("ADM");
  const [selectedCategory, setSelectedCategory] = useState("cross_functional");
  const [selectedDocType, setSelectedDocType] = useState(DOCUMENT_TYPES.CROSS_FUNCTIONAL);
  const [selectedStatus, setSelectedStatus] = useState(DOCUMENT_STATUS.PENDING);
  const [activeFlags, setActiveFlags] = useState(["hardware_replacement", "budget_allocation"]);
  const [activePreset, setActivePreset] = useState("it_depreciation");

  const loadPreset = (preset) => {
    setActivePreset(preset.id);
    setSelectedDept(preset.dept);
    setSelectedCategory(preset.category);
    setSelectedDocType(preset.type);
    setSelectedStatus(preset.status);
    setActiveFlags(preset.flags);
  };

  const toggleFlag = (flagId) => {
    setActiveFlags((prev) =>
      prev.includes(flagId) ? prev.filter((id) => id !== flagId) : [...prev, flagId]
    );
    setActivePreset(null);
  };

  // Mock document object for the live evaluator
  const mockDocument = useMemo(() => {
    const routedTo = computeRoutingTargets(
      selectedDept,
      selectedDocType,
      selectedCategory,
      activeFlags
    );

    return {
      id: "doc-preview-inspector",
      title: "Sample Council Record",
      department: selectedDept,
      category: selectedCategory,
      documentType: selectedDocType,
      status: selectedStatus,
      routedTo,
      actionFlags: activeFlags,
    };
  }, [selectedDept, selectedCategory, selectedDocType, selectedStatus, activeFlags]);

  // Compute live routing metrics
  const routingEvaluation = useMemo(() => evaluateRoutingRules(mockDocument), [mockDocument]);
  const roleClearanceList = useMemo(() => getRoleClearanceMatrix(mockDocument), [mockDocument]);

  return (
    <div className="routing-inspector">
      {/* Header & Preset Bar */}
      <header className="inspector-header">
        <div className="inspector-title-group">
          <h2>
            <GitFork size={22} style={{ color: "var(--color-accent)" }} />
            <span>Document Routing Engine & Category Matrix</span>
          </h2>
          <p>
            Simulate metadata tags to verify automated cross-departmental distribution,
            immediate notification triggers, and RBAC clearance across all council roles.
          </p>
        </div>

        <div className="inspector-presets-bar">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-chip ${activePreset === preset.id ? "active" : ""}`}
              onClick={() => loadPreset(preset)}
            >
              <Sparkles size={13} style={{ color: "var(--color-accent)" }} />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Control Panel */}
      <section className="inspector-control-panel">
        {/* Originating Department */}
        <div className="inspector-field">
          <label className="inspector-field-label">
            <Building size={14} />
            <span>Originating Department</span>
          </label>
          <select
            className="inspector-select"
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setActivePreset(null);
            }}
          >
            {Object.values(DEPARTMENTS).map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} — {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Document Type */}
        <div className="inspector-field">
          <label className="inspector-field-label">
            <Layers size={14} />
            <span>Document Type Tag</span>
          </label>
          <select
            className="inspector-select"
            value={selectedDocType}
            onChange={(e) => {
              setSelectedDocType(e.target.value);
              setActivePreset(null);
            }}
          >
            {Object.values(DOCUMENT_TYPES).map((type) => (
              <option key={type} value={type}>
                {getDocumentTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Document Lifecycle State */}
        <div className="inspector-field">
          <label className="inspector-field-label">
            <Eye size={14} />
            <span>Document State</span>
          </label>
          <select
            className="inspector-select"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setActivePreset(null);
            }}
          >
            {Object.values(DOCUMENT_STATUS).map((status) => (
              <option key={status} value={status}>
                {status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Action Flags Checklist */}
        <div className="inspector-field">
          <label className="inspector-field-label">
            <GitFork size={14} />
            <span>Actionable Flags</span>
          </label>
          <div className="action-flags-group">
            {Object.values(ACTION_FLAGS).map((flag) => (
              <label key={flag.id} className="flag-checkbox-label">
                <input
                  type="checkbox"
                  checked={activeFlags.includes(flag.id)}
                  onChange={() => toggleFlag(flag.id)}
                />
                <span>{flag.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Category Matrix Cards */}
      <section className="category-cards-grid" aria-label="Category Matrix">
        {Object.values(ROUTING_CATEGORIES).map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <div
              key={cat.id}
              className={`category-card ${isSelected ? "selected" : ""}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setActivePreset(null);
              }}
            >
              <div className="category-card-header">
                <Badge value={cat.badgeColor} type="status" withDot={false} />
                {isSelected && <Check size={16} style={{ color: "var(--color-accent)" }} />}
              </div>
              <div className="category-card-name">{cat.name}</div>
              <p className="category-card-desc">{cat.description}</p>
            </div>
          );
        })}
      </section>

      {/* Real-Time Routing Diagram */}
      <section className="routing-diagram-card">
        <div className="diagram-header">
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff" }}>
              Automated Routing & Notification Pipeline
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
              Evaluated based on Section 4 Conditional Matrix rules
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-accent)" }}>
              Security Clearance: {routingEvaluation.isConfidential ? "🔒 Strictly Isolated (HRS Only)" : "🌐 Multi-Departmental"}
            </span>
          </div>
        </div>

        <div className="diagram-flow-container">
          {/* Node 1: Origin */}
          <div className="flow-node origin">
            <span style={{ fontSize: "0.7rem", color: "#93c5fd", fontWeight: 700 }}>ORIGIN</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
              {routingEvaluation.originDepartment.code}
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
              {routingEvaluation.originDepartment.name}
            </span>
          </div>

          {/* Connector Arrow */}
          <div className="flow-connector">
            <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>CONDITIONAL MATRIX</span>
            <ArrowRight size={22} />
          </div>

          {/* Node 2: Engine Status */}
          <div className="flow-node engine">
            <span style={{ fontSize: "0.7rem", color: "var(--color-accent)", fontWeight: 700 }}>
              CATEGORY
            </span>
            <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#ffffff" }}>
              {routingEvaluation.categoryConfig.name}
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
              State: {selectedStatus.toUpperCase()}
            </span>
          </div>

          {/* Connector Arrow */}
          <div className="flow-connector">
            <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>MIRRORED TO</span>
            <ArrowRight size={22} />
          </div>

          {/* Node 3: Target Departments */}
          <div className="flow-node targets">
            <span style={{ fontSize: "0.7rem", color: "#6ee7b7", fontWeight: 700 }}>
              TARGET WORKSPACES ({routingEvaluation.routedDepartments.length})
            </span>
            <div className="flow-dept-chips">
              {routingEvaluation.routedDepartments.map((dept) => (
                <span key={dept.code} className="dept-pill">
                  {dept.code}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Immediate Notifications Output */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            borderRadius: "var(--radius-lg)",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bell size={16} style={{ color: "var(--color-accent)" }} />
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff" }}>
              Immediate In-App Notification Targets ({routingEvaluation.notifications.length} alerts):
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {routingEvaluation.notifications.map((notif, idx) => (
              <span
                key={idx}
                style={{
                  background: "rgba(26, 58, 92, 0.4)",
                  border: "1px solid rgba(201, 162, 39, 0.3)",
                  borderRadius: "6px",
                  padding: "0.3rem 0.6rem",
                  fontSize: "0.74rem",
                  color: "#f8fafc",
                }}
              >
                <strong>{notif.role.toUpperCase()}</strong> ({notif.department}): {notif.reason}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Live 8-Role Clearance Table */}
      <section className="card" style={{ padding: "1.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
            Live Multi-Role Clearance Matrix (RBAC Enforcement)
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
            Real-time evaluation against council governance rules for all 8 official MRDC roles.
          </p>
        </div>

        <div className="clearance-matrix-wrapper">
          <table className="clearance-table">
            <thead>
              <tr>
                <th>Officer / User</th>
                <th>Role Tier</th>
                <th>Department</th>
                <th>Access Verdict</th>
                <th>Governance Rationale</th>
              </tr>
            </thead>
            <tbody>
              {roleClearanceList.map((entry, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{entry.name}</td>
                  <td>
                    <Badge type="role" value={entry.role} withDot={false} />
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>
                      {entry.department}
                    </span>
                  </td>
                  <td>
                    {entry.canView ? (
                      <span className="clearance-status-tag allowed">
                        <CheckCircle2 size={13} />
                        <span>VIEW ALLOWED</span>
                      </span>
                    ) : (
                      <span className="clearance-status-tag hidden">
                        <XCircle size={13} />
                        <span>ACCESS HIDDEN</span>
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                    {entry.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default RoutingInspector;
