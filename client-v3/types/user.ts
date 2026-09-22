export interface ParsedStudentInfo {
  firstName: string;
  lastName: string;
  fullName: string;
  branchCode: string;
  branchName: string;
  passingYear: string;
  batch: string;
  academicYear: string;
}

export interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
