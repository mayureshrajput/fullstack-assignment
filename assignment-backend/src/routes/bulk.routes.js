import { Router } from 'express';
import auth from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { uploadCsv, uploadXlsx } from '../controllers/bulk.controller.js';

const r = Router();
r.use(auth);
r.post('/csv', upload.single('file'), uploadCsv);
r.post('/xlsx', upload.single('file'), uploadXlsx);
export default r;
