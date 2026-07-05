export type Gender = 'male' | 'female' | 'other';

export interface Person {
  id: string;
  organizationId: string;

  fullName: string;

  phone?: string;
  email?: string;

  gender: Gender;

  occupation?: string;

  state: string;
  city?: string;
  area?: string;

  notes?: string;

  profilePicture?: string;

  hasLogin: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonRequest {
  fullName: string;

  phone?: string;
  email?: string;

  gender: Gender;

  occupation?: string;

  state: string;
  city?: string;
  area?: string;

  notes?: string;

  profilePicture?: string;

  hasLogin?: boolean;
}

export interface UpdatePersonRequest extends Partial<CreatePersonRequest> {}

export interface ListPeopleParams {
  organizationId: string;
  page: number;
  limit: number;
}

export interface PaginatedPeople {
  people: Person[];
  page: number;
  limit: number;
  total: number;
}
