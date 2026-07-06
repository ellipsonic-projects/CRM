import { Router } from 'express';
import { auditRoutes } from '../modules/audit';
import { authRoutes } from '../modules/auth';
import { dashboardRoutes } from '../modules/dashboard';
import { eventRoutes } from '../modules/events';
import { organizationRoutes } from '../modules/organizations';
import { peopleRoutes } from '../modules/people';
import { relationshipRoutes } from '../modules/relationships';
import { uploadRoutes } from '../modules/uploads';

const router = Router();

router.use('/auth', authRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/organizations', organizationRoutes);
router.use('/events', eventRoutes);
router.use('/people', peopleRoutes);
router.use('/relationships', relationshipRoutes);
router.use('/uploads', uploadRoutes);

export default router;
