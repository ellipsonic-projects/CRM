import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './organization.schema';
import { OrganizationRepository } from './organization.repository';
import { Organization } from './organization.types';

export class OrganizationService {
  constructor(private readonly repository = new OrganizationRepository()) {}

  async createOrganization(data: CreateOrganizationDto): Promise<Organization> {
    return this.repository.create(data);
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.repository.findById(id);
  }

  async updateOrganization(
    organizationId: string,
    data: UpdateOrganizationDto,
  ): Promise<Organization | null> {
    return this.repository.update(organizationId, data);
  }

  async deleteOrganization(organizationId: string): Promise<boolean> {
    return this.repository.delete(organizationId);
  }
}
