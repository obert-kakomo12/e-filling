// MRDC E-Filing — Document Reference Number Generator
// Format: MRDC/[DEPT_CODE]/[YEAR]/[SEQUENCE]
// Example: MRDC/PMU/2026/047

import { db } from "../services/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

/**
 * Generates the next sequential reference number for a department in a given year.
 * @param {string} deptCode - Department code (e.g. "PMU")
 * @param {number} year - Fiscal year (e.g. 2026)
 * @returns {Promise<string>} - e.g. "MRDC/PMU/2026/048"
 */
export const generateRefNumber = async (deptCode, year) => {
  try {
    const docsRef = collection(db, "documents");
    const q = query(
      docsRef,
      where("department", "==", deptCode),
      where("fiscalYear", "==", year)
    );
    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count + 1;
    const sequence = String(count).padStart(3, "0");
    return `MRDC/${deptCode}/${year}/${sequence}`;
  } catch (error) {
    // Fallback with timestamp if Firestore fails (offline mode)
    const ts = Date.now().toString().slice(-4);
    return `MRDC/${deptCode}/${year}/${ts}`;
  }
};

/**
 * Returns the current fiscal year
 */
export const getCurrentFiscalYear = () => new Date().getFullYear();

/**
 * Parses a reference number into its components
 * @param {string} ref - e.g. "MRDC/PMU/2026/047"
 * @returns {{ org, dept, year, sequence }}
 */
export const parseRefNumber = (ref) => {
  const parts = ref.split("/");
  return {
    org: parts[0],
    dept: parts[1],
    year: parseInt(parts[2]),
    sequence: parseInt(parts[3]),
  };
};
