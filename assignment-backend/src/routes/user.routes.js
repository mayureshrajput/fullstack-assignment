import { Router } from 'express';
import auth from '../middleware/auth.middleware.js';
import { listUsers, updateUser, deleteUser } from '../controllers/user.controller.js';
const r = Router();

r.use(auth);
r.get('/', listUsers);
r.put('/:id', updateUser);
r.delete('/:id', deleteUser);

export default r;
