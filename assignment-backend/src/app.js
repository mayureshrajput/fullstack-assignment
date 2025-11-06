import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import errorHandler from './middleware/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import bulkRoutes from './routes/bulk.routes.js';
import reportRoutes from './routes/report.routes.js';

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Init DB (auto create tables if not exist)
await sequelize.sync({ alter: false });

app.get('/', (_req, res) => res.json({ ok: true, service: 'shop-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);
export default app;
