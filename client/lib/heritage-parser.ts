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

  if (map[py]) return map[py];
  if (py >= 2030) return "1st Year";
  if (py === 2029) return "2nd Year";
  if (py === 2028) return "3rd Year";
  return "4th Year";
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
      batch: "Class of 2028 (3rd Year)",
      academicYear: "3rd Year",
    };
  }

  const localPart = email.split("@")[0].toLowerCase();
  const parts = localPart.split(".");

  let rawFirst = "";
  let rawLast = "";
  let branchCode = "HITK";
  let passingYear = "";

  if (parts.length >= 2) {
    // The last part is always the branch + graduation year (e.g. iotcs28, cse28, aiml29)
    const branchYearPart = parts[parts.length - 1];
    rawFirst = parts[0];
    if (parts.length > 2) {
      rawLast = parts.slice(1, parts.length - 1).join(" ");
    }

    const match = branchYearPart.match(/^([a-zA-Z]+)(\d{2,4})?$/);
    if (match) {
      branchCode = match[1].toUpperCase();
      if (match[2]) {
        passingYear = match[2].length === 2 ? `20${match[2]}` : match[2];
      }
    } else {
      branchCode = branchYearPart.toUpperCase();
    }
  } else {
    rawFirst = localPart;
  }

  const capitalize = (str: string) =>
    str
      ? str
          .split(" ")
          .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
          .join(" ")
      : "";

  const firstName = rawFirst ? capitalize(rawFirst) : fallbackName?.split(" ")[0] || "Student";
  const lastName = rawLast ? capitalize(rawLast) : fallbackName?.split(" ").slice(1).join(" ") || "";
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  const branchName = BRANCH_MAP[branchCode] || `${branchCode} Department`;
  const finalYear = passingYear || "2028";
  const academicYear = getAcademicYearOfStudy(finalYear);
  const batch = `Class of ${finalYear} (${academicYear})`;

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
