const pool = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.me = async (req, res) => {
  const id = req.user.id;
  const [rows] = await pool.query('SELECT id, email, created_at, updated_at FROM users WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ message: 'User not found' });
  res.json(rows[0]);
};

exports.updateMe = async (req, res) => {
  const id = req.user.id;
  const { email, password } = req.body;
  try {
    if (email) {
      await pool.query('UPDATE users SET email = ? WHERE id = ?', [email, id]);
    }
    if (password) {
      const hash = await bcrypt.hash(password, saltRounds);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
    }
    const [rows] = await pool.query('SELECT id, email, created_at, updated_at FROM users WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
