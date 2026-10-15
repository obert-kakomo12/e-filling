// MRDC E-Filing — Section 4: Intelligent Document Routing Engine
// Core intelligence: decides department distribution, notification targets, and role clearance

import { DEPARTMENTS, DOCUMENT_TYPES, DOCUMENT_STATUS, ROLES, canViewDocument } from "./rbac";

/**
 * Official Category Matrix defined in Section 4
 */
export const ROUTING_CATEGORIES = {
  STRICTLY_CONFIDENTIAL: {
    id: "strictly_confidential",
    name: "Strictly Confidential Report",
    badgeColor: "rejected",
    description:
      "Locked entirely inside the originating department workspace. Visible only to originating staff, the HOD, and the CEO. Completely hidden from IT, Finance, Engineering, Auditors, and Councilors.",
    allowedDocumentTypes: [
      DOCUMENT_TYPES.STRICTLY_CONFIDENTIAL,
      DOCUMENT_TYPES.PAYROLL,
      DOCUMENT_TYPES.EMPLOYEE_RECORD,
      DOCUMENT_TYPES.MEDICAL_RECORD,
    ],
  },
  UPWARD_OPERATIONAL: {
    id: "upward_operational",
    name: "Upward-Routing Operational Report",
    badgeColor: "approved",
    description:
      "Visible to the originating team, the Department Director (HOD), the Internal Auditor, and the CEO. Hidden from unrelated departments like HR.",
    allowedDocumentTypes: [
      DOCUMENT_TYPES.OPERATIONAL_REPORT,
      DOCUMENT_TYPES.BUILDING_PLAN,
      DOCUMENT_TYPES.LAND_ALLOCATION,
      DOCUMENT_TYPES.LEASE_AGREEMENT,
      DOCUMENT_TYPES.CONTRACT,
    ],
  },
  CROSS_FUNCTIONAL: {
    id: "cross_functional",
    name: "Cross-Functional Actionable Report",
    badgeColor: "pending",
    description:
      "Automatically flags and mirrors the document onto the dashboards of both Finance (for budgeting) and PMU (for tender initiation / procurement).",
    allowedDocumentTypes: [
      DOCUMENT_TYPES.CROSS_FUNCTIONAL,
      DOCUMENT_TYPES.QUOTATION,
      DOCUMENT_TYPES.INVOICE,
      DOCUMENT_TYPES.RECEIPT,
      DOCUMENT_TYPES.TENDER_BID,
    ],
  },
  PUBLIC_COUNCIL: {
    id: "public_council",
    name: "Public & Council-Level Publication",
    badgeColor: "published",
    description:
      "Once approved by the HOD/Executive, publishes directly to the Councilor Portal so councilors can view (read-only) for voting and policy guidance.",
    allowedDocumentTypes: [
      DOCUMENT_TYPES.PUBLIC_COUNCIL,
      DOCUMENT_TYPES.BUDGET,
      DOCUMENT_TYPES.MINUTES,
      DOCUMENT_TYPES.RESOLUTION,
    ],
  },
};

/**
 * Actionable Trigger Flags for Cross-Functional Workflow Automation
 */
export const ACTION_FLAGS = {
  HARDWARE_REPLACEMENT: {
    id: "hardware_replacement",
    label: "Hardware / Asset Replacement Required",
    description: "Flags IT report to mirror onto Finance (budgeting) and PMU (procurement)",
    targetDepts: [DEPARTMENTS.FIN.code, DEPARTMENTS.PMU.code],
  },
  BUDGET_ALLOCATION: {
    id: "budget_allocation",
    label: "Budget Allocation Required",
    description: "Triggers automatic routing to Finance Department",
    targetDepts: [DEPARTMENTS.FIN.code],
  },
  TENDER_INITIATION: {
    id: "tender_initiation",
    label: "Tender Initiation / Procurement Required",
    description: "Triggers automatic routing to Procurement Management Unit (PMU)",
    targetDepts: [DEPARTMENTS.PMU.code],
  },
  LEGAL_REVIEW: {
    id: "legal_review",
    label: "Legal Compliance & Housing Review",
    description: "Triggers automatic routing to Administration & Legal (ADM)",
    targetDepts: [DEPARTMENTS.ADM.code],
  },
};

/**
 * Given a document's parameters, computes the full list of department codes
 * that receive auto-routed access (routedTo array).
 *
 * @param {string} originDept - Originating department code
 * @param {string} documentType - Document type tag
 * @param {string} category - Category tag from ROUTING_CATEGORIES
 * @param {string[]} actionFlags - Array of active action flag IDs
 * @returns {string[]} - Array of department codes
 */
export const computeRoutingTargets = (
  originDept,
  documentType,
  category = "upward_operational",
  actionFlags = []
) => {
  // 1. Strictly Confidential Rule: Locked entirely inside originating department
  if (
    category === ROUTING_CATEGORIES.STRICTLY_CONFIDENTIAL.id ||
    [
      DOCUMENT_TYPES.PAYROLL,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      DOCUMENT_TYPES.EMPLOYEE_RECORD,
      DOCUMENT_TYPES.STRICTLY_CONFIDENTIAL,
    ].includes(documentType)
  ) {
    return [originDept];
  }

  const targets = [originDept];

  // 2. Action Flags Rule (e.g. IT asset replacement flags Finance + PMU)
  if (Array.isArray(actionFlags)) {
    actionFlags.forEach((flagId) => {
      const flagConfig = ACTION_FLAGS[flagId.toUpperCase()] || Object.values(ACTION_FLAGS).find((f) => f.id === flagId);
      if (flagConfig && flagConfig.targetDepts) {
        flagConfig.targetDepts.forEach((deptCode) => {
          if (!targets.includes(deptCode)) targets.push(deptCode);
        });
      }
    });
  }

  // 3. Document Type Specific Rules
  switch (documentType) {
    case DOCUMENT_TYPES.QUOTATION:
      if (!targets.includes(DEPARTMENTS.PMU.code)) targets.push(DEPARTMENTS.PMU.code);
      if (!targets.includes(DEPARTMENTS.FIN.code)) targets.push(DEPARTMENTS.FIN.code);
      break;

    case DOCUMENT_TYPES.TENDER_BID:
      if (!targets.includes(DEPARTMENTS.PMU.code)) targets.push(DEPARTMENTS.PMU.code);
      break;

    case DOCUMENT_TYPES.INVOICE:
    case DOCUMENT_TYPES.RECEIPT:
      if (!targets.includes(DEPARTMENTS.FIN.code)) targets.push(DEPARTMENTS.FIN.code);
      break;

    case DOCUMENT_TYPES.CROSS_FUNCTIONAL:
      if (!targets.includes(DEPARTMENTS.PMU.code)) targets.push(DEPARTMENTS.PMU.code);
      if (!targets.includes(DEPARTMENTS.FIN.code)) targets.push(DEPARTMENTS.FIN.code);
      break;

    default:
      break;
  }

  return [...new Set(targets)];
};

/**
 * Determines the exact notification recipients (departments & roles)
 * when a document is uploaded or routed.
 */
export const getNotificationTargets = (
  originDept,
  documentType,
  category = "upward_operational",
  actionFlags = []
) => {
  const routedTo = computeRoutingTargets(originDept, documentType, category, actionFlags);
  const notifications = [];

  // 1. Originating Department HOD always gets notified for approval
  notifications.push({
    department: originDept,
    role: ROLES.HOD,
    reason: "Originating Department Approval Required",
  });

  // 2. If Strictly Confidential: No other notifications outside HR + CEO
  if (category === ROUTING_CATEGORIES.STRICTLY_CONFIDENTIAL.id) {
    notifications.push({
      department: originDept,
      role: ROLES.CEO,
      reason: "Executive Confidential Filing Notification",
    });
    return notifications;
  }

  // 3. Routed Departments HODs/Officers receive action notifications
  routedTo.forEach((deptCode) => {
    if (deptCode !== originDept) {
      notifications.push({
        department: deptCode,
        role: ROLES.HOD,
        reason: `Cross-Functional Action Flagged from ${originDept}`,
      });
      notifications.push({
        department: deptCode,
        role: ROLES.SPECIALIZED_OFFICER,
        reason: `Actionable Document Shared to ${deptCode}`,
      });
    }
  });

  // 4. Internal Auditor gets notified for all upward operational & financial docs
  notifications.push({
    department: DEPARTMENTS.AUD.code,
    role: ROLES.AUDITOR,
    reason: "Internal Audit Compliance Register",
  });

  // 5. CEO gets high-level visibility
  notifications.push({
    department: DEPARTMENTS.ADM.code,
    role: ROLES.CEO,
    reason: "Council Executive Progress Log",
  });

  return notifications;
};

/**
 * Evaluates the full routing intelligence for a document
 * Returns an explanatory object describing routing targets, triggers, and security.
 */
export const evaluateRoutingRules = (document) => {
  const {
    department: originDept = "ADM",
    documentType = DOCUMENT_TYPES.OPERATIONAL_REPORT,
    category = "upward_operational",
    actionFlags = [],
    status = DOCUMENT_STATUS.PENDING,
  } = document;

  const routedTargets = computeRoutingTargets(originDept, documentType, category, actionFlags);
  const notifications = getNotificationTargets(originDept, documentType, category, actionFlags);

  const isConfidential =
    category === ROUTING_CATEGORIES.STRICTLY_CONFIDENTIAL.id ||
    [
      DOCUMENT_TYPES.PAYROLL,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      DOCUMENT_TYPES.EMPLOYEE_RECORD,
      DOCUMENT_TYPES.STRICTLY_CONFIDENTIAL,
    ].includes(documentType);

  const isPublicCouncil =
    category === ROUTING_CATEGORIES.PUBLIC_COUNCIL.id ||
    [
      DOCUMENT_TYPES.PUBLIC_COUNCIL,
      DOCUMENT_TYPES.BUDGET,
      DOCUMENT_TYPES.RESOLUTION,
      DOCUMENT_TYPES.MINUTES,
    ].includes(documentType);

  return {
    originDepartment: DEPARTMENTS[originDept] || { code: originDept, name: originDept },
    routedDepartments: routedTargets.map((code) => DEPARTMENTS[code] || { code, name: code }),
    categoryConfig:
      ROUTING_CATEGORIES[category.toUpperCase()] || ROUTING_CATEGORIES.UPWARD_OPERATIONAL,
    isConfidential,
    isPublicCouncil,
    notifications,
    councilorAccess:
      isPublicCouncil && status === DOCUMENT_STATUS.PUBLISHED
        ? "Allowed (Read-Only)"
        : "Hidden (Draft/Operational)",
    externalAuditorAccess:
      [DOCUMENT_TYPES.INVOICE, DOCUMENT_TYPES.RECEIPT, DOCUMENT_TYPES.BUDGET].includes(documentType) &&
      [DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.PUBLISHED].includes(status)
        ? "Allowed (Read-Only)"
        : "Hidden (Restricted)",
  };
};

/**
 * Generates the live Role-by-Role Clearance Matrix for a specific document
 * Tests all 8 roles across sample departments to see exact view clearance.
 */
export const getRoleClearanceMatrix = (document) => {
  const sampleUsers = [
    {
      role: ROLES.SYSADMIN,
      department: "ADM",
      name: "T. Mutasa (SysAdmin)",
      roleLabel: "System Administrator",
    },
    {
      role: ROLES.CEO,
      department: "ADM",
      name: "Dr. F. Shumba (CEO)",
      roleLabel: "Chief Executive Officer",
    },
    {
      role: ROLES.HOD,
      department: document.department || "CET",
      name: `Originating HOD (${document.department || "CET"})`,
      roleLabel: "Director / HOD (Origin)",
    },
    {
      role: ROLES.HOD,
      department: document.department === "HRS" ? "CET" : "HRS",
      name: `Other Dept HOD (${document.department === "HRS" ? "CET" : "HRS"})`,
      roleLabel: "Director / HOD (Unrelated)",
    },
    {
      role: ROLES.SPECIALIZED_OFFICER,
      department: "PMU",
      name: "C. Zhou (PMU Officer)",
      roleLabel: "Specialized Procurement Officer",
    },
    {
      role: ROLES.SPECIALIZED_OFFICER,
      department: "FIN",
      name: "Finance Officer",
      roleLabel: "Specialized Finance Officer",
    },
    {
      role: ROLES.CLERK,
      department: document.department || "CET",
      name: `Originating Clerk (${document.department || "CET"})`,
      roleLabel: "Registry Clerk (Origin)",
    },
    {
      role: ROLES.CLERK,
      department: document.department === "ADM" ? "CET" : "ADM",
      name: "Other Dept Clerk",
      roleLabel: "Registry Clerk (Unrelated)",
    },
    {
      role: ROLES.AUDITOR,
      department: "AUD",
      name: "P. Chitepo (Auditor)",
      roleLabel: "Internal Auditor",
    },
    {
      role: ROLES.COUNCILOR,
      department: "ADM",
      name: "Hon. G. Munodawafa (Councilor)",
      roleLabel: "Councilor (Ward 4)",
    },
    {
      role: ROLES.EXTERNAL_AUDITOR,
      department: "AUD",
      name: "K. Mavhunga (OAG Auditor)",
      roleLabel: "External Auditor (OAG)",
    },
  ];

  return sampleUsers.map((testUser) => {
    const canView = canViewDocument(testUser, document);
    let reason = "";

    if (testUser.role === ROLES.SYSADMIN) {
      reason = "Full system oversight clearance";
    } else if (testUser.role === ROLES.COUNCILOR) {
      reason = canView
        ? "Item is Approved & Published for council policy review"
        : "Councilors cannot access unfinished drafts or operational files";
    } else if (testUser.role === ROLES.EXTERNAL_AUDITOR) {
      reason = canView
        ? "Approved/published financial record (Invoice/Receipt/Budget)"
        : "External auditors only inspect approved financial vouchers";
    } else if (
      document.department === "HRS" &&
      (document.category === "strictly_confidential" ||
        [DOCUMENT_TYPES.PAYROLL, DOCUMENT_TYPES.STRICTLY_CONFIDENTIAL].includes(document.documentType))
    ) {
      if (testUser.role === ROLES.CEO) {
        reason = "CEO executive clearance for confidential HR files";
      } else if (testUser.department === "HRS") {
        reason = "Originating HR department workspace member";
      } else {
        reason = "Strictly confidential — locked inside HR workspace";
      }
    } else if (canView) {
      if (testUser.department === document.department) {
        reason = "Belongs to originating department";
      } else if (document.routedTo && document.routedTo.includes(testUser.department)) {
        reason = `Cross-routed to ${testUser.department} for actionable review`;
      } else if (testUser.role === ROLES.CEO || testUser.role === ROLES.AUDITOR) {
        reason = "Global operational oversight clearance";
      }
    } else {
      reason = "No clearance — outside department boundary";
    }

    return {
      ...testUser,
      canView,
      reason,
    };
  });
};

/**
 * Friendly label for document types
 */
export const getDocumentTypeLabel = (type) => {
  const labels = {
    [DOCUMENT_TYPES.STRICTLY_CONFIDENTIAL]: "Strictly Confidential",
    [DOCUMENT_TYPES.OPERATIONAL_REPORT]: "Operational Report",
    [DOCUMENT_TYPES.CROSS_FUNCTIONAL]: "Cross-Functional Report",
    [DOCUMENT_TYPES.PUBLIC_COUNCIL]: "Public Council Document",
    [DOCUMENT_TYPES.QUOTATION]: "Quotation",
    [DOCUMENT_TYPES.INVOICE]: "Invoice",
    [DOCUMENT_TYPES.RECEIPT]: "Receipt",
    [DOCUMENT_TYPES.TENDER_BID]: "Tender Bid",
    [DOCUMENT_TYPES.PAYROLL]: "Payroll Report",
    [DOCUMENT_TYPES.CONTRACT]: "Contract",
    [DOCUMENT_TYPES.BUDGET]: "Budget",
    [DOCUMENT_TYPES.MINUTES]: "Meeting Minutes",
    [DOCUMENT_TYPES.RESOLUTION]: "Resolution",
    [DOCUMENT_TYPES.LAND_ALLOCATION]: "Land Allocation",
    [DOCUMENT_TYPES.LEASE_AGREEMENT]: "Lease Agreement",
    [DOCUMENT_TYPES.BUILDING_PLAN]: "Building Plan",
    [DOCUMENT_TYPES.EMPLOYEE_RECORD]: "Employee Record",
    [DOCUMENT_TYPES.MEDICAL_RECORD]: "Medical Record",
  };
  return labels[type] || type;
};
