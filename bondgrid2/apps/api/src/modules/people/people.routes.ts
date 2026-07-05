import { Router } from 'express';
import { authenticate } from '../auth';
import { RelationshipController } from '../relationships';
import { singleImageUpload } from '../uploads';
import { PeopleController } from './people.controller';

const router = Router();
const controller = new PeopleController();
const relationshipController = new RelationshipController();

router.use(authenticate);
router.get('/', controller.listPeople);
router.post('/', singleImageUpload('profilePicture'), controller.createPerson);
router.get(
  '/:id/relationships',
  relationshipController.listPersonRelationships,
);
router.get('/:id', controller.getPersonById);
router.patch(
  '/:id',
  singleImageUpload('profilePicture'),
  controller.updatePerson,
);
router.delete('/:id', controller.deletePerson);

export default router;
