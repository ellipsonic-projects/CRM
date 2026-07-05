export interface Organization {
  id: string;
  name: string;
  organizationType: string;
  phone?: string;
  email?: string;
  state: string;
  city?: string;
  area?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  organizationType: string;
  phone?: string;
  email?: string;
  state: string;
  city?: string;
  area?: string;
}
