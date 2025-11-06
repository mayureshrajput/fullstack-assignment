import { Router } from 'express';
import auth from '../middleware/auth.middleware.js';
import { createCategory, listCategories, updateCategory, deleteCategory } from '../controllers/category.controller.js';

const r = Router();
r.use(auth);
r.post('/', createCategory);
r.get('/', listCategories);
r.put('/:id', updateCategory);
r.delete('/:id', deleteCategory);
export default r;
