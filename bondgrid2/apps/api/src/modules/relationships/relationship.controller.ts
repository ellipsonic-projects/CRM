import { NextFunction, Request, Response } from 'express';

import { RelationshipServiceError } from './relationship.errors';
import {
  createRelationshipSchema,
  updateRelationshipSchema,
} from './relationship.schema';
import { RelationshipService } from './relationship.service';

function getRelationshipErrorStatus(error: RelationshipServiceError): number {
  if (error.code === 'DUPLICATE_RELATIONSHIP') {
    return 409;
  }

  if (
    error.code === 'MISSING_PERSON' ||
    error.code === 'RELATIONSHIP_NOT_FOUND'
  ) {
    return 404;
  }

  return 400;
}

export class RelationshipController {
  constructor(private readonly service = new RelationshipService()) {}

  getRelationshipTypes = (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      data: this.service.getRelationshipTypes(),
    });
  };

  createRelationship = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const body = createRelationshipSchema.parse(req.body);
      const relationship = await this.service.createRelationship(
        req.user.organizationId,
        body,
        req.user.userId,
      );

      res.status(201).json({
        success: true,
        data: relationship,
      });
    } catch (error) {
      if (error instanceof RelationshipServiceError) {
        res.status(getRelationshipErrorStatus(error)).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  };

  listRelationships = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const relationships = await this.service.listRelationships(
        req.user.organizationId,
      );

      res.status(200).json({
        success: true,
        data: relationships,
      });
    } catch (error) {
      next(error);
    }
  };

  getRelationshipById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid relationship id.',
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

      const relationship = await this.service.getRelationshipById(
        req.user.organizationId,
        id,
      );

      if (!relationship) {
        res.status(404).json({
          success: false,
          error: 'Relationship not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: relationship,
      });
    } catch (error) {
      next(error);
    }
  };

  listPersonRelationships = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid person id.',
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

      const relationships = await this.service.listPersonRelationships(
        req.user.organizationId,
        id,
      );

      if (!relationships) {
        res.status(404).json({
          success: false,
          error: 'Person not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: relationships,
      });
    } catch (error) {
      next(error);
    }
  };

  updateRelationship = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid relationship id.',
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

      const body = updateRelationshipSchema.parse(req.body);
      const relationship = await this.service.updateRelationship(
        req.user.organizationId,
        id,
        body,
      );

      if (!relationship) {
        res.status(404).json({
          success: false,
          error: 'Relationship not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: relationship,
      });
    } catch (error) {
      if (error instanceof RelationshipServiceError) {
        res.status(getRelationshipErrorStatus(error)).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  };

  deleteRelationship = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid relationship id.',
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

      const deleted = await this.service.deleteRelationship(
        req.user.organizationId,
        id,
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Relationship not found.',
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
