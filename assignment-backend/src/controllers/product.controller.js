import asyncHandler from 'express-async-handler';
import { Product, Category } from '../models/index.js';
import { Op } from 'sequelize';

// Create
export const createProduct = asyncHandler(async (req, res) => {
  const { name, image, price, categoryId } = req.body;
  if (!name || !price || !categoryId) throw { status: 400, message: 'name, price, categoryId required' };
  const cat = await Category.findByPk(categoryId);
  if (!cat) throw { status: 400, message: 'Invalid category' };
  const p = await Product.create({ name, image, price, categoryId });
  res.status(201).json(p);
});

// Update
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const p = await Product.findByPk(id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  const { name, image, price, categoryId } = req.body;
  if (categoryId) {
    const cat = await Category.findByPk(categoryId);
    if (!cat) throw { status: 400, message: 'Invalid category' };
    p.categoryId = categoryId;
  }
  if (name) p.name = name;
  if (image !== undefined) p.image = image;
  if (price) p.price = price;
  await p.save();
  res.json(p);
});

// Delete
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const count = await Product.destroy({ where: { id } });
  res.json({ deleted: !!count });
});

// Get one
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const p = await Product.findByPk(id, { include: [{ model: Category }] });
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json(p);
});

// List with pagination, sorting, search
export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
  const offset = (page - 1) * limit;

  const sort = (req.query.sort || 'price').toString();
  const order = (req.query.order || 'asc').toString().toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const q = (req.query.q || '').toString().trim();
  const category = (req.query.category || '').toString().trim();

  const where = {};
  if (q) where.name = { [Op.like]: `%${q}%` };

  const include = [{
    model: Category,
    where: category ? { name: { [Op.like]: `%${category}%` } } : undefined,
    required: !!category
  }];

  const { rows, count } = await Product.findAndCountAll({
    where, include,
    order: [[sort === 'price' ? 'price' : 'name', order]],
    offset, limit
  });

  res.json({
    page, limit, total: count,
    data: rows
  });
});
