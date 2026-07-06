import { Router } from 'express';
import { authenticate } from '../auth';
import { DashboardController } from './dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.use(authenticate);
router.get('/', controller.getDashboard);

export default router;
