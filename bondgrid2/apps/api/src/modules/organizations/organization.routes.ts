import { Router } from 'express';
import { authenticate } from '../auth';
import { OrganizationController } from './organization.controller';

const router = Router();
const controller = new OrganizationController();

router.post('/', controller.createOrganization);
router.get('/:id', controller.getOrganizationById);
router.patch('/me', authenticate, controller.updateOrganization);
router.delete('/me', authenticate, controller.deleteOrganization);

export default router;
