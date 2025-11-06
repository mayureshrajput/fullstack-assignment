import { Router } from 'express';
import auth from '../middleware/auth.middleware.js';
import { createProduct, updateProduct, deleteProduct, getProduct, listProducts } from '../controllers/product.controller.js';

const r = Router();
r.use(auth);
r.post('/', createProduct);
r.get('/', listProducts);          // pagination/sort/search
r.get('/:id', getProduct);
r.put('/:id', updateProduct);
r.delete('/:id', deleteProduct);
export default r;
