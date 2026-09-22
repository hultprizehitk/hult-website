export type UserRole = "user" | "junior_admin" | "lead_admin" | "master_admin";

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

export interface IUserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  department: string;
  year: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

