// MRDC E-Filing — RBAC Permission Engine
// Defines exactly what each role can see and do across the system

export const ROLES = {
  SYSADMIN: "sysadmin",
  CEO: "ceo",
  HOD: "hod",
  SPECIALIZED_OFFICER: "specialized_officer",
  CLERK: "clerk",
  AUDITOR: "auditor",
  COUNCILOR: "councilor",
  EXTERNAL_AUDITOR: "external_auditor",
};

export const DEPARTMENTS = {
  ADM: { code: "ADM", name: "Administration & Housing" },
  LCS: { code: "LCS", name: "Land & Community Services" },
  CET: { code: "CET", name: "Civil Engineering & Technical Services" },
  PMU: { code: "PMU", name: "Procurement Management Unit" },
  FIN: { code: "FIN", name: "Finance & Accounts" },
  HRS: { code: "HRS", name: "Human Resources" },
  AUD: { code: "AUD", name: "Audit & Compliance" },
};

export const DOCUMENT_TYPES = {
  STRICTLY_CONFIDENTIAL: "strictly_confidential",
  OPERATIONAL_REPORT: "operational_report",
  CROSS_FUNCTIONAL: "cross_functional",
  PUBLIC_COUNCIL: "public_council",
  QUOTATION: "quotation",
  INVOICE: "invoice",
  RECEIPT: "receipt",
  TENDER_BID: "tender_bid",
  PAYROLL: "payroll",
  CONTRACT: "contract",
  BUDGET: "budget",
  MINUTES: "minutes",
  RESOLUTION: "resolution",
  LAND_ALLOCATION: "land_allocation",
  LEASE_AGREEMENT: "lease_agreement",
  BUILDING_PLAN: "building_plan",
  EMPLOYEE_RECORD: "employee_record",
  MEDICAL_RECORD: "medical_record",
};

export const DOCUMENT_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

// What each role can DO
export const PERMISSIONS = {
  [ROLES.SYSADMIN]: {
    canUpload: true,
    canApprove: true,
    canReject: true,
    canDelete: true,
    canManageUsers: true,
    canViewAuditLog: true,
    canArchiveFiscalYear: true,
    canCreateExternalAuditor: true,
    canViewAllDepts: true,
    canPublish: true,
  },
  [ROLES.CEO]: {
    canUpload: false,
    canApprove: false,
    canReject: false,
    canDelete: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canArchiveFiscalYear: false,
    canCreateExternalAuditor: false,
    canViewAllDepts: true,
    canViewDrafts: true,
    canPublish: false,
  },
  [ROLES.HOD]: {
    canUpload: true,
    canApprove: true,
    canReject: true,
    canDelete: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canArchiveFiscalYear: false,
    canViewAllDepts: false,
    canViewDrafts: true,
    canPublish: false,
  },
  [ROLES.SPECIALIZED_OFFICER]: {
    canUpload: true,
    canApprove: false,
    canReject: false,
    canDelete: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canArchiveFiscalYear: false,
    canViewAllDepts: false,
    canViewDrafts: false,
    canPublish: false,
  },
  [ROLES.CLERK]: {
    canUpload: true,
    canApprove: false,
    canReject: false,
    canDelete: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canArchiveFiscalYear: false,
    canViewAllDepts: false,
    canViewDrafts: true, // only their own uploads
    canPublish: false,
  },
  [ROLES.AUDITOR]: {
    canUpload: false,
    canApprove: false,
    canReject: false,
    canDelete: false,
    canManageUsers: false,
    canViewAuditLog: true,
    canArchiveFiscalYear: false,
    canViewAllDepts: true, // read-only global
    canViewDrafts: true,
    canPublish: false,
  },
  [ROLES.COUNCILOR]: {
    canUpload: false,
    canApprove: false,
    canReject: false,
    canDelete: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canArchiveFiscalYear: false,
    canViewAllDepts: false,
    canViewDrafts: false, // published only
    canPublish: false,
  },
  [ROLES.EXTERNAL_AUDITOR]: {
    canUpload: false,
    canApprove: false,
    canReject: false,
    canDelete: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canArchiveFiscalYear: false,
    canViewAllDepts: false,
    canViewDrafts: false,
    canPublish: false,
  },
};

// Check if a user has a specific permission
export const hasPermission = (role, permission) => {
  return PERMISSIONS[role]?.[permission] === true;
};

// Check if a user can view a document based on role + doc state + dept
export const canViewDocument = (user, document) => {
  if (!user || !document) return false;
  const { role, department } = user;
  const {
    status,
    department: docDept,
    documentType,
    category,
    routedTo = [],
    uploaderId,
  } = document;

  // 1. SysAdmin sees everything across the entire council
  if (role === ROLES.SYSADMIN) return true;

  // 2. Archived documents: accessible read-only to those who had approved access
  if (status === DOCUMENT_STATUS.ARCHIVED) {
    return canViewDocument(user, { ...document, status: DOCUMENT_STATUS.APPROVED });
  }

  // 3. Councilor Role (Governance/Oversight):
  // Councilors ONLY see "Published" items (finalized budgets, approved resolutions, published reports)
  // They NEVER see unfinished drafts, pending reviews, internal IT/dept requests, or raw files
  if (role === ROLES.COUNCILOR) {
    return status === DOCUMENT_STATUS.PUBLISHED;
  }

  // 4. External Auditor Role:
  // Strictly restricted to Invoices, Receipts, and Budgets that are Approved or Published
  if (role === ROLES.EXTERNAL_AUDITOR) {
    const allowedTypes = [
      DOCUMENT_TYPES.INVOICE,
      DOCUMENT_TYPES.RECEIPT,
      DOCUMENT_TYPES.BUDGET,
    ];
    return (
      allowedTypes.includes(documentType) &&
      [DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.PUBLISHED].includes(status)
    );
  }

  const isHrConfidential =
    docDept === DEPARTMENTS.HRS.code &&
    (category === "strictly_confidential" ||
      [
        DOCUMENT_TYPES.STRICTLY_CONFIDENTIAL,
        DOCUMENT_TYPES.PAYROLL,
        DOCUMENT_TYPES.EMPLOYEE_RECORD,
        DOCUMENT_TYPES.MEDICAL_RECORD,
      ].includes(documentType));

  // 5. CEO Role:
  // Global view across all departments and all document states (including drafts and pending)
  // Per Section 4A: CEO CAN view HR Strictly Confidential / Payroll
  if (role === ROLES.CEO) {
    return true;
  }

  // 6. Internal Auditor Role:
  // Global oversight read-only across all council departments EXCEPT HR Strictly Confidential
  if (role === ROLES.AUDITOR) {
    if (isHrConfidential) return false;
    return true;
  }

  // 7. HR Strictly Confidential isolation:
  // If document is HR confidential, ONLY HR staff, HR Director, and CEO (checked above) have access
  if (isHrConfidential) {
    return department === DEPARTMENTS.HRS.code;
  }

  // 8. Originating Department HOD:
  // Full visibility over all documents originating in their department
  if (role === ROLES.HOD && department === docDept) {
    return true;
  }

  // 9. Routed Departments (Cross-Functional / Actionable / Quotations / Invoices):
  // If the document has been routed to this user's department:
  if (routedTo && Array.isArray(routedTo) && routedTo.includes(department)) {
    // HODs and Specialized Officers in the destination department can view routed documents
    if (role === ROLES.HOD || role === ROLES.SPECIALIZED_OFFICER) {
      return true;
    }
    // Clerks in destination department can view once approved or published
    if (role === ROLES.CLERK && [DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.PUBLISHED].includes(status)) {
      return true;
    }
  }

  // 10. Originating Department Clerk:
  // Clerks see documents inside their own department
  if (department === docDept) {
    // Clerks can always see approved/published docs in their dept, or drafts they uploaded themselves
    if (role === ROLES.CLERK) {
      if ([DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.PUBLISHED, DOCUMENT_STATUS.PENDING].includes(status)) {
        return true;
      }
      if (status === DOCUMENT_STATUS.DRAFT && document.uploaderId === user.uid) {
        return true;
      }
      return false;
    }
    return true;
  }

  // Default: strictly hidden from unrelated departments
  return false;
};
