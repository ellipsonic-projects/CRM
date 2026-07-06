import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { recordAudit } from '../audit';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from './organization.schema';
import { OrganizationService } from './organization.service';

export class OrganizationController {
  constructor(
    private readonly organizationService = new OrganizationService(),
  ) {}

  createOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = createOrganizationSchema.parse(req.body);
      const organization =
        await this.organizationService.createOrganization(body);

      res.status(201).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.issues,
        });
        return;
      }

      next(error);
    }
  };

  getOrganizationById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid organization id',
        });
        return;
      }

      const organization =
        await this.organizationService.getOrganizationById(id);

      if (!organization) {
        res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrganization = async (
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

      const body = updateOrganizationSchema.parse(req.body);
      const organization = await this.organizationService.updateOrganization(
        req.user.organizationId,
        body,
      );

      if (!organization) {
        res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
        return;
      }

      void recordAudit({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        action: 'UPDATE_ORGANIZATION',
        entity: 'Organization',
        entityId: organization.id,
        entityName: organization.name,
        summary: `Updated organization ${organization.name}.`,
      });

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteOrganization = async (
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

      await recordAudit({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        action: 'DELETE_ORGANIZATION',
        entity: 'Organization',
        entityId: req.user.organizationId,
        summary: 'Deleted organization.',
      });

      const deleted = await this.organizationService.deleteOrganization(
        req.user.organizationId,
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
