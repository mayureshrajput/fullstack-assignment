import asyncHandler from 'express-async-handler';
import { Product, Category } from '../models/index.js';
import { streamCsv } from '../utils/csv.util.js';
import { streamXlsx } from '../utils/excel.util.js';

export const downloadCsv = asyncHandler(async (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
  const rows = await Product.findAll({ include: [{ model: Category }], order: [['name','ASC']] });
  await streamCsv(rows, res);
});

export const downloadXlsx = asyncHandler(async (_req, res) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="products.xlsx"');
  const rows = await Product.findAll({ include: [{ model: Category }], order: [['name','ASC']] });
  await streamXlsx(rows, res);
});
