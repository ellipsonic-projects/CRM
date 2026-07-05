import { Router } from 'express';
import { authRoutes } from '../modules/auth';
import { organizationRoutes } from '../modules/organizations';
import { peopleRoutes } from '../modules/people';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/people', peopleRoutes);

export default router;
