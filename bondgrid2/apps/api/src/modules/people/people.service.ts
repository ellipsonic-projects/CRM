import { PeopleRepository } from './people.repository';
import {
  CreatePersonDto,
  ListPeopleQueryDto,
  UpdatePersonDto,
} from './people.schema';
import { PaginatedPeople, Person } from './people.types';

export class PeopleService {
  constructor(private readonly repository = new PeopleRepository()) {}

  async createPerson(
    organizationId: string,
    data: CreatePersonDto,
  ): Promise<Person | null> {
    // Future business rules:
    // - Duplicate phone/email detection
    // - Permission checks
    // - Audit logging
    // - Auto-create login
    // - Event publishing

    return this.repository.create(organizationId, data);
  }

  async listPeople(
    organizationId: string,
    params: ListPeopleQueryDto,
  ): Promise<PaginatedPeople | null> {
    return this.repository.findAllByOrganization(organizationId, params);
  }

  async getPersonById(
    organizationId: string,
    id: string,
  ): Promise<Person | null> {
    return this.repository.findById(organizationId, id);
  }

  async updatePerson(
    organizationId: string,
    id: string,
    data: UpdatePersonDto,
  ): Promise<Person | null> {
    return this.repository.update(organizationId, id, data);
  }

  async deletePerson(organizationId: string, id: string): Promise<boolean> {
    return this.repository.delete(organizationId, id);
  }
}
