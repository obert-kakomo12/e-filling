// MRDC E-Filing — Authentication Service

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { logAuditEvent, AUDIT_ACTIONS } from "./auditService";

export const DEMO_USERS = [
  {
    uid: "demo-sysadmin",
    email: "sysadmin@mrdc.gov.zw",
    displayName: "T. Mutasa",
    title: "System Administrator",
    role: "sysadmin",
    department: "ADM",
    isActive: true,
  },
  {
    uid: "demo-ceo",
    email: "ceo@mrdc.gov.zw",
    displayName: "Dr. F. Shumba",
    title: "Chief Executive Officer",
    role: "ceo",
    department: "ADM",
    isActive: true,
  },
  {
    uid: "demo-hod-cet",
    email: "hod.cet@mrdc.gov.zw",
    displayName: "Eng. R. Moyo",
    title: "Director Technical Services",
    role: "hod",
    department: "CET",
    isActive: true,
  },
  {
    uid: "demo-hod-hrs",
    email: "hod.hrs@mrdc.gov.zw",
    displayName: "M. Chikwanha",
    title: "Director Human Resources",
    role: "hod",
    department: "HRS",
    isActive: true,
  },
  {
    uid: "demo-pmu-officer",
    email: "pmu@mrdc.gov.zw",
    displayName: "C. Zhou",
    title: "PMU Procurement Officer",
    role: "specialized_officer",
    department: "PMU",
    isActive: true,
  },
  {
    uid: "demo-clerk-adm",
    email: "clerk.adm@mrdc.gov.zw",
    displayName: "S. Dube",
    title: "Registry & Records Clerk",
    role: "clerk",
    department: "ADM",
    isActive: true,
  },
  {
    uid: "demo-auditor",
    email: "auditor@mrdc.gov.zw",
    displayName: "P. Chitepo",
    title: "Chief Internal Auditor",
    role: "auditor",
    department: "AUD",
    isActive: true,
  },
  {
    uid: "demo-councilor",
    email: "councilor.ward4@mrdc.gov.zw",
    displayName: "Hon. G. Munodawafa",
    title: "Councilor — Ward 4",
    role: "councilor",
    department: "ADM",
    ward: "4",
    isActive: true,
  },
  {
    uid: "demo-ext-auditor",
    email: "external.oag@audit.gov.zw",
    displayName: "K. Mavhunga",
    title: "OAG External Auditor",
    role: "external_auditor",
    department: "AUD",
    isActive: true,
  },
];

/**
 * Sign in with a demo role account for development or testing
 */
export const loginWithDemoAccount = (roleOrUid) => {
  const match = DEMO_USERS.find(
    (u) => u.role === roleOrUid || u.uid === roleOrUid || u.email === roleOrUid
  ) || DEMO_USERS[0];

  localStorage.setItem("mrdc_demo_user", JSON.stringify(match));
  return match;
};

/**
 * Sign in a user with email + password.
 * Loads their full profile (role, dept) from Firestore after auth.
 */
export const loginUser = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Load profile from Firestore
  const profileSnap = await getDoc(doc(db, "users", user.uid));
  if (!profileSnap.exists()) {
    throw new Error("User profile not found. Contact your system administrator.");
  }

  const profile = profileSnap.data();

  if (!profile.isActive) {
    await signOut(auth);
    throw new Error("Your account has been deactivated. Contact the SysAdmin.");
  }

  // Log login to audit trail
  await logAuditEvent({
    userId: user.uid,
    userName: profile.displayName,
    action: AUDIT_ACTIONS.LOGIN,
    documentId: null,
    documentTitle: null,
    details: `Logged in from web app`,
  });

  // Update last login timestamp
  await updateDoc(doc(db, "users", user.uid), {
    lastLogin: serverTimestamp(),
  });

  return { uid: user.uid, email: user.email, ...profile };
};

/**
 * Sign out the current user and log the event.
 */
export const logoutUser = async (userId, userName) => {
  await logAuditEvent({
    userId,
    userName,
    action: AUDIT_ACTIONS.LOGOUT,
    documentId: null,
    documentTitle: null,
    details: "Logged out",
  });
  await signOut(auth);
};

/**
 * Subscribe to Firebase auth state changes.
 * Returns the unsubscribe function.
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profileSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (profileSnap.exists()) {
        callback({ uid: firebaseUser.uid, email: firebaseUser.email, ...profileSnap.data() });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Change the current user's password (requires current password for re-auth).
 */
export const changePassword = async (user, currentPassword, newPassword) => {
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(auth.currentUser, credential);
  await updatePassword(auth.currentUser, newPassword);
};

/**
 * Fetches all council users for Admin Directory
 */
export const fetchCouncilUsers = async () => {
  let users = [];

  // 1. Fetch from Firestore if configured
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, "users"));
      users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    } catch (err) {
      console.warn("Firestore user fetch failed, using local directory:", err);
    }
  }

  // 2. Fetch locally provisioned users
  try {
    const local = JSON.parse(localStorage.getItem("mrdc_local_users") || "[]");
    users = [...local, ...users];
  } catch (e) {
    console.error("Local user parse error:", e);
  }

  // 3. Fallback to DEMO_USERS
  const seenUids = new Set(users.map((u) => u.uid));
  DEMO_USERS.forEach((demo) => {
    if (!seenUids.has(demo.uid)) {
      users.push(demo);
    }
  });

  return users;
};

/**
 * Creates a new council officer account (SysAdmin only)
 */
export const createCouncilUser = async ({
  displayName,
  email,
  role,
  department,
  title,
  createdBy,
}) => {
  const newUid = `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const newUser = {
    uid: newUid,
    displayName,
    email: email.toLowerCase().trim(),
    role,
    department,
    title: title || `${role.toUpperCase()} Officer`,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: createdBy?.uid || "sysadmin",
  };

  // 1. Save to Firestore if live
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, "users", newUid), {
        ...newUser,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Firestore user creation failed:", e);
    }
  }

  // 2. Persist to local storage
  try {
    const local = JSON.parse(localStorage.getItem("mrdc_local_users") || "[]");
    localStorage.setItem("mrdc_local_users", JSON.stringify([newUser, ...local]));
  } catch (e) {
    console.error("Local storage error:", e);
  }

  // 3. Log to immutable audit trail
  await logAuditEvent({
    userId: createdBy?.uid || "sysadmin",
    userName: createdBy?.displayName || "System Administrator",
    action: AUDIT_ACTIONS.USER_CREATED,
    documentId: null,
    documentTitle: null,
    details: `Provisioned council officer account for ${displayName} (${role.toUpperCase()} • ${department})`,
  });

  return newUser;
};

/**
 * Provisions a temporary External Auditor account with expiry window
 */
export const createExternalAuditorUser = async ({
  displayName,
  email,
  firm = "Office of the Auditor General (OAG)",
  validDays = 30,
  createdBy,
}) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(validDays));

  const newUid = `ext-auditor-${Date.now()}`;
  const extUser = {
    uid: newUid,
    displayName,
    email: email.toLowerCase().trim(),
    role: "external_auditor",
    department: "AUD",
    title: `External Auditor (${firm})`,
    firm,
    expiresAt: expiryDate.toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: createdBy?.uid || "sysadmin",
  };

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, "users", newUid), {
        ...extUser,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Firestore external auditor save failed:", e);
    }
  }

  try {
    const local = JSON.parse(localStorage.getItem("mrdc_local_users") || "[]");
    localStorage.setItem("mrdc_local_users", JSON.stringify([extUser, ...local]));
  } catch (e) {
    console.error("Local storage error:", e);
  }

  await logAuditEvent({
    userId: createdBy?.uid || "sysadmin",
    userName: createdBy?.displayName || "System Administrator",
    action: AUDIT_ACTIONS.EXTERNAL_AUDITOR_CREATED,
    documentId: null,
    documentTitle: null,
    details: `Created temporary External Auditor credentials for ${displayName} (${firm}), valid for ${validDays} days until ${expiryDate.toLocaleDateString()}`,
  });

  return extUser;
};

/**
 * Toggles an officer account active/suspended status
 */
export const toggleUserActiveStatus = async (userId, currentStatus, adminUser) => {
  const newStatus = !currentStatus;

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "users", userId), {
        isActive: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Firestore user status toggle failed:", e);
    }
  }

  // Update local storage
  try {
    const local = JSON.parse(localStorage.getItem("mrdc_local_users") || "[]");
    const updated = local.map((u) => (u.uid === userId ? { ...u, isActive: newStatus } : u));
    localStorage.setItem("mrdc_local_users", JSON.stringify(updated));
  } catch (e) {
    console.error("Local status update error:", e);
  }

  await logAuditEvent({
    userId: adminUser?.uid || "sysadmin",
    userName: adminUser?.displayName || "System Administrator",
    action: newStatus ? "USER_ACTIVATED" : AUDIT_ACTIONS.USER_DEACTIVATED,
    documentId: null,
    documentTitle: null,
    details: `${newStatus ? "Re-activated" : "Suspended/Deactivated"} account for UID [${userId}]`,
  });

  return newStatus;
};
