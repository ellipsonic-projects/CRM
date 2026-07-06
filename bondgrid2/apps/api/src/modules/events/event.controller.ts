import { NextFunction, Request, Response } from 'express';
import { recordAudit } from '../audit';
import { EventService, EventValidationError } from './event.service';
import {
  createEventSchema,
  listEventsQuerySchema,
  updateEventSchema,
} from './event.schema';

function normalizeBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(body as Record<string, unknown>)
      .map(([key, value]) => [key, value === '' ? undefined : value])
      .filter(([, value]) => value !== undefined),
  );
}

export class EventController {
  constructor(private readonly eventService = new EventService()) {}

  createEvent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = createEventSchema.parse(normalizeBody(req.body));

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const event = await this.eventService.createEvent(
        req.user.organizationId,
        req.user.userId,
        body,
      );

      if (!event) {
        res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
        return;
      }

      void recordAudit({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        action: 'CREATE_EVENT',
        entity: 'Event',
        entityId: event.id,
        entityName: event.title,
        summary: `Created event ${event.title}.`,
      });

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  };

  listEvents = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = listEventsQuerySchema.parse(req.query);

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const result = await this.eventService.listEvents(
        req.user.organizationId,
        query,
      );

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.events,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getEventById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid event id',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const event = await this.eventService.getEventById(
        req.user.organizationId,
        id,
      );

      if (!event) {
        res.status(404).json({
          success: false,
          error: 'Event not found',
        });
        return;
      }

      void recordAudit({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        action: 'UPDATE_EVENT',
        entity: 'Event',
        entityId: event.id,
        entityName: event.title,
        summary: `Updated event ${event.title}.`,
      });

      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  };

  updateEvent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid event id',
        });
        return;
      }

      const body = updateEventSchema.parse(normalizeBody(req.body));

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const event = await this.eventService.updateEvent(
        req.user.organizationId,
        id,
        body,
      );

      if (!event) {
        res.status(404).json({
          success: false,
          error: 'Event not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      if (error instanceof EventValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  };

  deleteEvent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid event id',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const deleted = await this.eventService.deleteEvent(
        req.user.organizationId,
        id,
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Event not found',
        });
        return;
      }

      void recordAudit({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        action: 'DELETE_EVENT',
        entity: 'Event',
        entityId: id,
        summary: `Deleted event ${id}.`,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
