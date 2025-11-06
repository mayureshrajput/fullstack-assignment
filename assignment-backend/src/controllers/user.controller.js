import asyncHandler from 'express-async-handler';
import { User } from '../models/index.js';

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.findAll({ attributes: ['id', 'email', 'createdAt'] });
  res.json(users);
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const u = await User.findByPk(id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  if (email) u.email = email;
  await u.save();
  res.json({ id: u.id, email: u.email });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const u = await User.findByPk(id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  await u.destroy();
  res.json({ success: true });
});
