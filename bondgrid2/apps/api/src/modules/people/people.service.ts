import { PeopleRepository } from './people.repository';
import {
  CreatePersonDto,
  ListPeopleQueryDto,
  UpdatePersonDto,
} from './people.schema';
import { PaginatedPeople, Person } from './people.types';
import { UploadService } from '../uploads';

const PERSON_PROFILE_PICTURE_FOLDER = 'bondgrid/people';

export class PeopleService {
  constructor(
    private readonly repository = new PeopleRepository(),
    private readonly uploadService = new UploadService(),
  ) {}

  async createPerson(
    organizationId: string,
    data: CreatePersonDto,
    profilePicture?: Express.Multer.File,
  ): Promise<Person | null> {
    const personId = data.personId?.trim();

    if (personId) {
      const existing = await this.repository.findByPersonId(
        organizationId,
        personId,
      );

      if (existing) {
        if (!profilePicture) {
          return this.repository.updateByPersonId(organizationId, personId, data);
        }

        const uploaded = await this.uploadService.uploadImage(
          profilePicture.buffer,
          PERSON_PROFILE_PICTURE_FOLDER,
        );

        await this.uploadService.deleteImage(existing.profilePicturePublicId);

        const updated = await this.repository.updateByPersonId(
          organizationId,
          personId,
          {
            ...data,
            profilePicture: uploaded.secureUrl,
            profilePictureUrl: uploaded.secureUrl,
            profilePicturePublicId: uploaded.publicId,
          },
        );

        if (!updated) {
          await this.uploadService.deleteImage(uploaded.publicId);
        }

        return updated;
      }
    }

    if (!profilePicture) {
      return this.repository.create(organizationId, data);
    }

    const uploaded = await this.uploadService.uploadImage(
      profilePicture.buffer,
      PERSON_PROFILE_PICTURE_FOLDER,
    );

    const created = await this.repository.create(organizationId, {
      ...data,
      profilePicture: uploaded.secureUrl,
      profilePictureUrl: uploaded.secureUrl,
      profilePicturePublicId: uploaded.publicId,
    });

    if (!created) {
      await this.uploadService.deleteImage(uploaded.publicId);
    }

    return created;
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

  async getPersonByPersonId(
    organizationId: string,
    personId: string,
  ): Promise<Person | null> {
    return this.repository.findByPersonId(organizationId, personId);
  }

  async updatePerson(
    organizationId: string,
    id: string,
    data: UpdatePersonDto,
    profilePicture?: Express.Multer.File,
  ): Promise<Person | null> {
    if (!profilePicture) {
      return this.repository.update(organizationId, id, data);
    }

    const existing = await this.repository.findById(organizationId, id);

    if (!existing) {
      return null;
    }

    const uploaded = await this.uploadService.uploadImage(
      profilePicture.buffer,
      PERSON_PROFILE_PICTURE_FOLDER,
    );

    await this.uploadService.deleteImage(existing.profilePicturePublicId);

    const updated = await this.repository.update(organizationId, id, {
      ...data,
      profilePicture: uploaded.secureUrl,
      profilePictureUrl: uploaded.secureUrl,
      profilePicturePublicId: uploaded.publicId,
    });

    if (!updated) {
      await this.uploadService.deleteImage(uploaded.publicId);
    }

    return updated;
  }

  async deletePerson(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.repository.findById(organizationId, id);

    if (!existing) {
      return false;
    }

    await this.uploadService.deleteImage(existing.profilePicturePublicId);

    return this.repository.delete(organizationId, id);
  }
}
