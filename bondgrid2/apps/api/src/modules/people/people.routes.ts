import { Router } from 'express';
import { authenticate } from '../auth';
import { PeopleController } from './people.controller';

const router = Router();
const controller = new PeopleController();

router.use(authenticate);
router.get('/', controller.listPeople);
router.post('/', controller.createPerson);
router.get('/:id', controller.getPersonById);
router.patch('/:id', controller.updatePerson);
router.delete('/:id', controller.deletePerson);

export default router;
