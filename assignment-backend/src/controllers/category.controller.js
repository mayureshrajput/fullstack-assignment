import asyncHandler from 'express-async-handler';
import { Category, Product } from '../models/index.js';

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw { status: 400, message: 'Name required' };
  const c = await Category.create({ name });
  res.status(201).json(c);
});

export const listCategories = asyncHandler(async (_req, res) => {
  const data = await Category.findAll({ order: [['name', 'ASC']] });
  res.json(data);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const c = await Category.findByPk(id);
  if (!c) return res.status(404).json({ message: 'Not found' });
  c.name = req.body.name ?? c.name;
  await c.save();
  res.json(c);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const used = await Product.count({ where: { categoryId: id } });
  if (used > 0) throw { status: 400, message: 'Category has products' };
  const c = await Category.destroy({ where: { id } });
  res.json({ deleted: !!c });
});
