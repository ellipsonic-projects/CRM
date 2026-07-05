import { Router } from 'express';
import { authRoutes } from '../modules/auth';
import { organizationRoutes } from '../modules/organizations';
import { peopleRoutes } from '../modules/people';
import { relationshipRoutes } from '../modules/relationships';
import { uploadRoutes } from '../modules/uploads';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/people', peopleRoutes);
router.use('/relationships', relationshipRoutes);
router.use('/uploads', uploadRoutes);

export default router;
