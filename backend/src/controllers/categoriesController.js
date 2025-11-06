const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  try {
    const id = uuidv4();
    await pool.query('INSERT INTO categories (id, name) VALUES (?, ?)', [id, name]);
    res.status(201).json({ id, name });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Category name must be unique' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listCategories = async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, created_at, updated_at FROM categories ORDER BY name ASC');
  res.json(rows);
};

exports.getCategory = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT id, name FROM categories WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ message: 'Category not found' });
  res.json(rows[0]);
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    const [rows] = await pool.query('SELECT id, name FROM categories WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Category name must be unique' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  res.json({ message: 'Deleted' });
};
