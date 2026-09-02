export type UserRole = "student" | "admin" | "superadmin";

export interface Participant {
  _id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  role: UserRole | string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminRecord {
  _id: string;
  name: string;
  email: string;
  department?: string;
  year?: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

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
