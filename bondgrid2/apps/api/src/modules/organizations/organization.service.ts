import { CreateOrganizationDto } from "./organization.schema";
import { OrganizationRepository } from "./organization.repository";
import { Organization } from "./organization.types";

export class OrganizationService {
  constructor(
    private readonly repository = new OrganizationRepository()
  ) {}

  async createOrganization(
    data: CreateOrganizationDto
  ): Promise<Organization> {
    return this.repository.create(data);
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.repository.findById(id);
  }
}
