export type UserRole =
  | "student"
  | "junior_admin"
  | "lead_admin"
  | "master_admin";

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
