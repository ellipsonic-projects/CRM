import { Router } from 'express';
import { authenticate } from '../auth';
import { EventController } from './event.controller';

const router = Router();
const controller = new EventController();

router.use(authenticate);
router.get('/', controller.listEvents);
router.post('/', controller.createEvent);
router.get('/:id', controller.getEventById);
router.patch('/:id', controller.updateEvent);
router.delete('/:id', controller.deleteEvent);

export default router;
