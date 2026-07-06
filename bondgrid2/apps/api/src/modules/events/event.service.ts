import {
  CreateEventDto,
  ListEventsQueryDto,
  UpdateEventDto,
} from './event.schema';
import { EventRepository } from './event.repository';
import { Event, PaginatedEvents } from './event.types';

export class EventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventValidationError';
  }
}

export class EventService {
  constructor(private readonly repository = new EventRepository()) {}

  async createEvent(
    organizationId: string,
    createdBy: string,
    data: CreateEventDto,
  ): Promise<Event | null> {
    return this.repository.create(organizationId, createdBy, data);
  }

  async listEvents(
    organizationId: string,
    params: ListEventsQueryDto,
  ): Promise<PaginatedEvents | null> {
    return this.repository.findAllByOrganization(organizationId, params);
  }

  async getEventById(
    organizationId: string,
    id: string,
  ): Promise<Event | null> {
    return this.repository.findById(organizationId, id);
  }

  async updateEvent(
    organizationId: string,
    id: string,
    data: UpdateEventDto,
  ): Promise<Event | null> {
    const existing = await this.repository.findById(organizationId, id);

    if (!existing) {
      return null;
    }

    const startDateTime = data.startDateTime ?? existing.startDateTime;
    const endDateTime = data.endDateTime ?? existing.endDateTime;

    if (
      endDateTime &&
      new Date(endDateTime).getTime() < new Date(startDateTime).getTime()
    ) {
      throw new EventValidationError(
        'End date and time must be after the start date and time.',
      );
    }

    return this.repository.update(organizationId, id, data);
  }

  async deleteEvent(organizationId: string, id: string): Promise<boolean> {
    return this.repository.delete(organizationId, id);
  }
}
