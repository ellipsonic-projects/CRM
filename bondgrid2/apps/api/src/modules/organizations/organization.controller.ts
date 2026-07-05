import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { createOrganizationSchema } from './organization.schema';
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
}
