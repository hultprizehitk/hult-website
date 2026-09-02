export interface ParsedStudentInfo {
  firstName: string;
  lastName: string;
  fullName: string;
  branchCode: string;
  branchName: string;
  passingYear: string;
  batch: string;
  academicYear: string; // e.g. "3rd Year" for 2028
}

const BRANCH_MAP: Record<string, string> = {
  IOTCS: "IoT & Cyber Security (CS)",
  CSE: "Computer Science & Engineering",
  IT: "Information Technology",
  CSBS: "Computer Science & Business Systems",
  CSDS: "Computer Science & Data Science",
  AIML: "Artificial Intelligence & Machine Learning",
  ECE: "Electronics & Communication Engineering",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  BT: "Biotechnology",
  CHE: "Chemical Engineering",
  CIVIL: "Civil Engineering",
  CE: "Civil Engineering",
  AEIE: "Applied Electronics & Instrumentation",
  MCA: "Master of Computer Applications",
  MBA: "Master of Business Administration",
};


/**
 * Calculates current academic year of study based on graduation passing year.
 * Rule: 2028 passing year = 3rd Year student
 */
export function getAcademicYearOfStudy(passingYear: string): string {
  const py = parseInt(passingYear, 10);
  if (!py || isNaN(py)) return "3rd Year";

  const map: Record<number, string> = {
    2026: "Final Year (4th Year)",
    2027: "4th Year",
    2028: "3rd Year",
    2029: "2nd Year",
    2030: "1st Year",
  };

  return map[py] || (py > 2028 ? "2nd Year" : "3rd Year");
}

export function parseHeritageEmail(email: string, fallbackName?: string | null): ParsedStudentInfo {
  if (!email || !email.includes("@")) {
    return {
      firstName: fallbackName || "Student",
      lastName: "",
      fullName: fallbackName || "Heritage Student",
      branchCode: "HITK",
      branchName: "Heritage Institute of Technology",
      passingYear: "2028",
      batch: "Class of 2028",
      academicYear: "3rd Year",
    };
  }

  const localPart = email.split("@")[0].toLowerCase();
  const parts = localPart.split(".");

  let rawFirst = "";
  let rawLast = "";
  let branchCode = "HITK";
  let passingYear = "";

  if (parts.length >= 3) {
    // Standard format: [firstName].[lastName].[branch][year]@heritageit.edu.in
    // Example: harsh.raj.iotcs28@heritageit.edu.in
    rawFirst = parts[0];
    rawLast = parts[1];
    const branchYearPart = parts.slice(2).join(".");

    const match = branchYearPart.match(/^([a-zA-Z]+)(\d{2,4})?$/);
    if (match) {
      branchCode = match[1].toUpperCase();
      if (match[2]) {
        passingYear = match[2].length === 2 ? `20${match[2]}` : match[2];
      }
    } else {
      branchCode = branchYearPart.toUpperCase();
    }
  } else if (parts.length === 2) {
    // Format: [name].[branch][year]
    rawFirst = parts[0];
    const match = parts[1].match(/^([a-zA-Z]+)(\d{2,4})?$/);
    if (match) {
      branchCode = match[1].toUpperCase();
      if (match[2]) {
        passingYear = match[2].length === 2 ? `20${match[2]}` : match[2];
      }
    }
  } else {
    rawFirst = localPart;
  }

  const capitalize = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const firstName = rawFirst ? capitalize(rawFirst) : fallbackName?.split(" ")[0] || "Student";
  const lastName = rawLast ? capitalize(rawLast) : fallbackName?.split(" ").slice(1).join(" ") || "";
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  const branchName = BRANCH_MAP[branchCode] || `${branchCode} Department`;
  const finalYear = passingYear || "2028";
  const batch = `Class of ${finalYear}`;
  const academicYear = getAcademicYearOfStudy(finalYear);

  return {
    firstName,
    lastName,
    fullName,
    branchCode,
    branchName,
    passingYear: finalYear,
    batch,
    academicYear,
  };
}
