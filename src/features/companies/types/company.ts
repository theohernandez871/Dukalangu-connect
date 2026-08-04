export interface CompanyDetails {
  id: string;
  name: string;
  slug: string;
  ownerId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  location: string | null;
  phone: string | null;
  managerId: string | null;
  managerName?: string | null;
  isHq: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface BranchInput {
  name: string;
  location?: string;
  phone?: string;
  managerId?: string | null;
}
