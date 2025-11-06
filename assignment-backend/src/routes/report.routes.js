import { Router } from 'express';
import auth from '../middleware/auth.middleware.js';
import { downloadCsv, downloadXlsx } from '../controllers/report.controller.js';

const r = Router();
r.use(auth);
r.get('/csv', downloadCsv);
r.get('/xlsx', downloadXlsx);
export default r;
