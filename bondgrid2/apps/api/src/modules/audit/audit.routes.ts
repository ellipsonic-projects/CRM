import { Router } from 'express';
import { authenticate } from '../auth';
import { AuditController } from './audit.controller';

const router = Router();
const controller = new AuditController();

router.use(authenticate);
router.get('/', controller.listAuditLogs);

export default router;
