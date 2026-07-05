import { Router } from 'express';

import { authenticate } from '../auth';
import { singleImageUpload } from './multer';
import { UploadController } from './upload.controller';

const router = Router();
const controller = new UploadController();

router.use(authenticate);
router.post('/images', singleImageUpload('image'), controller.uploadImage);

export default router;
