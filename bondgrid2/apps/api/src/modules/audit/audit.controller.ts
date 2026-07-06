import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AuditService } from './audit.service';

const auditActionSchema = z.enum([
  'LOGIN',
  'LOGOUT',
  'CREATE_PERSON',
  'UPDATE_PERSON',
  'DELETE_PERSON',
  'CREATE_RELATIONSHIP',
  'UPDATE_RELATIONSHIP',
  'DELETE_RELATIONSHIP',
  'CREATE_EVENT',
  'UPDATE_EVENT',
  'DELETE_EVENT',
  'CREATE_USER',
  'UPDATE_USER_ROLE',
  'UPDATE_ORGANIZATION',
  'DELETE_ORGANIZATION',
]);

const auditEntitySchema = z.enum([
  'Auth',
  'Person',
  'Relationship',
  'Event',
  'User',
  'Organization',
]);

const listAuditLogsQuerySchema = z.object({
  search: z.string().optional(),
  action: auditActionSchema.optional(),
  entity: auditEntitySchema.optional(),
});

export class AuditController {
  constructor(private readonly service = new AuditService()) {}

  listAuditLogs = async (
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

      const query = listAuditLogsQuerySchema.parse(req.query);
      const logs = await this.service.list(req.user.organizationId, query);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };
}
