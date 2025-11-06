import asyncHandler from 'express-async-handler';
import fs from 'fs';
import csv from 'fast-csv';
import xlsx from 'xlsx';
import { Product, Category } from '../models/index.js';

// CSV/XLSX schema: name, image, price, categoryName

const upsertRow = async (row) => {
  const name = (row.name || row.Name || '').toString().trim();
  if (!name) return;
  const image = (row.image || row.Image || '').toString().trim() || null;
  const price = parseFloat(row.price || row.Price || 0);
  const categoryName = (row.categoryName || row.Category || '').toString().trim();
  if (!categoryName || Number.isNaN(price)) return;

  let cat = await Category.findOne({ where: { name: categoryName } });
  if (!cat) cat = await Category.create({ name: categoryName });

  await Product.create({ name, image, price, categoryId: cat.id });
};

export const uploadCsv = asyncHandler(async (req, res) => {
  if (!req.file) throw { status: 400, message: 'File required' };

  const path = req.file.path;
  const summary = { processed: 0, skipped: 0, errors: 0 };

  res.status(202).json({ message: 'Upload received, processing started', file: req.file.filename });

  // Process stream in background (fire-and-forget in same process)
  const stream = fs.createReadStream(path).pipe(csv.parse({ headers: true, ignoreEmpty: true, trim: true }));
  stream.on('error', () => { /* swallow */ });
  stream.on('data', async (row) => {
    stream.pause();
    try { await upsertRow(row); summary.processed++; } catch { summary.errors++; }
    finally { stream.resume(); }
  });
  stream.on('end', async () => {
    fs.unlink(path, () => {});
    console.log('CSV bulk complete:', summary);
  });
});

export const uploadXlsx = asyncHandler(async (req, res) => {
  if (!req.file) throw { status: 400, message: 'File required' };
  const path = req.file.path;
  res.status(202).json({ message: 'Upload received, processing started', file: req.file.filename });

  setImmediate(async () => {
    try {
      const wb = xlsx.readFile(path);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });
      for (const row of rows) {
        try { await upsertRow(row); } catch { /* ignore */ }
      }
    } finally {
      fs.unlink(path, () => {});
      console.log('XLSX bulk complete');
    }
  });
});
