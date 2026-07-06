import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from './auth.middleware';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login);
router.post('/admin-signup', controller.adminSignup);
router.get('/me', authenticate, controller.me);
router.get('/users', authenticate, controller.listUsers);
router.post('/users', authenticate, controller.createUser);
router.patch('/users/:id/role', authenticate, controller.updateUserRole);
router.post('/logout', authenticate, controller.logout);

export default router;
