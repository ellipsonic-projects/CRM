import { NextFunction, Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  constructor(private readonly service = new DashboardService()) {}

  getDashboard = async (
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

      const dashboard = await this.service.getDashboard(req.user.organizationId);

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  };
}
