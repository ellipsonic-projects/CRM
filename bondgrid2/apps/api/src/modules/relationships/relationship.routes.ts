import { Router } from 'express';

import { authenticate } from '../auth';
import { RelationshipController } from './relationship.controller';

const router = Router();
const controller = new RelationshipController();

router.use(authenticate);
router.get('/types', controller.getRelationshipTypes);
router.get('/', controller.listRelationships);
router.post('/', controller.createRelationship);
router.get('/:id', controller.getRelationshipById);
router.put('/:id', controller.updateRelationship);
router.delete('/:id', controller.deleteRelationship);

export default router;
