import { Request, Response, NextFunction } from 'express';

import { PeopleService } from './people.service';
import {
  createPersonSchema,
  listPeopleQuerySchema,
  updatePersonSchema,
} from './people.schema';

function normalizeMultipartBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(body as Record<string, unknown>)
      .map(([key, value]) => {
        if (value === '') {
          return [key, undefined];
        }

        if (key === 'hasLogin' && typeof value === 'string') {
          return [key, value === 'true'];
        }

        return [key, value];
      })
      .filter(([, value]) => value !== undefined),
  );
}

export class PeopleController {
  constructor(private readonly peopleService = new PeopleService()) {}

  createPerson = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = createPersonSchema.parse(normalizeMultipartBody(req.body));

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const person = await this.peopleService.createPerson(
        req.user.organizationId,
        body,
        req.file,
      );

      if (!person) {
        res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: person,
      });
    } catch (error) {
      next(error);
    }
  };

  listPeople = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = listPeopleQuerySchema.parse(req.query);

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const result = await this.peopleService.listPeople(
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
        data: result.people,
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

  getPersonById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid person id',
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

      const person = await this.peopleService.getPersonById(
        req.user.organizationId,
        id,
      );

      if (!person) {
        res.status(404).json({
          success: false,
          error: 'Person not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: person,
      });
    } catch (error) {
      next(error);
    }
  };

  updatePerson = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid person id',
        });
        return;
      }

      const body = updatePersonSchema.parse(normalizeMultipartBody(req.body));

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const person = await this.peopleService.updatePerson(
        req.user.organizationId,
        id,
        body,
        req.file,
      );

      if (!person) {
        res.status(404).json({
          success: false,
          error: 'Person not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: person,
      });
    } catch (error) {
      next(error);
    }
  };

  deletePerson = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid person id',
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

      const deleted = await this.peopleService.deletePerson(
        req.user.organizationId,
        id,
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Person not found',
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
