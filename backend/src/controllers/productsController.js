const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const fastCsv = require('fast-csv');
const stream = require('stream');
const ExcelJS = require('exceljs');
const { chunkArray } = require('../utils/batchInsert');

const BATCH_SIZE = parseInt(process.env.BATCH_INSERT_SIZE || '500', 10);

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, imageUrl, price, categoryId } = req.body;
    if (!name || !categoryId) return res.status(400).json({ message: 'name and categoryId required' });
    const id = uuidv4();
    await pool.query(
      'INSERT INTO products (id, name, image_url, price, category_id) VALUES (?, ?, ?, ?, ?)',
      [id, name, imageUrl || null, price || 0, categoryId]
    );
    res.status(201).json({ id, name, imageUrl, price, categoryId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List with pagination, sorting and search
exports.listProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const perPage = parseInt(req.query.perPage || '10', 10);
    const sort = req.query.sort === 'price_desc' ? 'DESC' : req.query.sort === 'price_asc' ? 'ASC' : null;
    const search = req.query.search || null;
    const category = req.query.category || null; // search by category name

    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push('p.name LIKE ?');
      params.push(`%${search}%`);
    }
    if (category) {
      whereClauses.push('c.name LIKE ?');
      params.push(`%${category}%`);
    }

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // total count
    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) as total
       FROM products p
       JOIN categories c ON p.category_id = c.id
       ${whereSQL}`,
      params
    );

    const offset = (page - 1) * perPage;

    let orderSQL = '';
    if (sort) orderSQL = `ORDER BY p.price ${sort}`;
    else orderSQL = `ORDER BY p.created_at DESC`;

    const sql = `
      SELECT p.id, p.name, p.image_url, p.price, p.category_id, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${whereSQL}
      ${orderSQL}
      LIMIT ? OFFSET ?
    `;

    const finalParams = params.concat([perPage, offset]);
    const [rows] = await pool.query(sql, finalParams);

    res.json({
      page,
      perPage,
      total: countRow.total,
      totalPages: Math.ceil(countRow.total / perPage),
      data: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProduct = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.image_url, p.price, p.category_id, c.name as category_name
     FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Not found' });
  res.json(rows[0]);
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, imageUrl, price, categoryId } = req.body;
    const fields = [];
    const params = [];
    if (name) { fields.push('name = ?'); params.push(name); }
    if (typeof imageUrl !== 'undefined') { fields.push('image_url = ?'); params.push(imageUrl); }
    if (typeof price !== 'undefined') { fields.push('price = ?'); params.push(price); }
    if (categoryId) { fields.push('category_id = ?'); params.push(categoryId); }
    if (!fields.length) return res.status(400).json({ message: 'No fields to update' });
    params.push(id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
    const [rows] = await pool.query('SELECT id, name, image_url AS imageUrl, price, category_id AS categoryId FROM products WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
};

// Bulk CSV upload streaming and batch insert
exports.bulkUploadCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file required (field name: file)' });
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    const csvStream = fastCsv.parse({ headers: true, ignoreEmpty: true, trim: true });
    const rowsToInsert = [];
    const problems = [];
    bufferStream.pipe(csvStream)
      .on('error', error => {
        console.error(error);
        return res.status(500).json({ message: 'CSV parse error' });
      })
      .on('data', row => {
        // Expected CSV columns: name, price, category (category name)
        const name = row.name;
        const price = parseFloat(row.price || 0) || 0;
        const categoryName = row.category || 'Uncategorized';
        if (!name) {
          problems.push({ row, reason: 'Missing name' });
          return;
        }
        rowsToInsert.push({ name, price, categoryName, imageUrl: row.image || null });
      })
      .on('end', async rowCount => {
        try {
          // Ensure categories exist; collect unique category names
          const uniqueCats = [...new Set(rowsToInsert.map(r => r.categoryName))];
          const catMap = {}; // name -> id
          // Check existing categories
          if (uniqueCats.length) {
            const placeholders = uniqueCats.map(() => '?').join(',');
            const [existing] = await pool.query(`SELECT id, name FROM categories WHERE name IN (${placeholders})`, uniqueCats);
            existing.forEach(r => catMap[r.name] = r.id);

            // Insert missing categories
            const toCreate = uniqueCats.filter(n => !catMap[n]);
            for (const name of toCreate) {
              const id = uuidv4();
              await pool.query('INSERT INTO categories (id, name) VALUES (?, ?)', [id, name]);
              catMap[name] = id;
            }
          }

          // Prepare product rows with category_id
          const productRows = rowsToInsert.map(r => [uuidv4(), r.name, r.imageUrl, r.price, catMap[r.categoryName]]);
          // Batch insert
          const chunks = chunkArray(productRows, BATCH_SIZE);
          for (const chunk of chunks) {
            const values = chunk.map(() => '(?, ?, ?, ?, ?)').join(', ');
            const flat = chunk.flat();
            await pool.query(
              `INSERT INTO products (id, name, image_url, price, category_id) VALUES ${values}`,
              flat
            );
          }

          res.json({ inserted: productRows.length, problems });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: 'Server error during bulk insert' });
        }
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Stream CSV report
exports.reportCSV = async (req, res) => {
  try {
    // Query all products with category names
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.image_url AS image, p.price, c.name AS category
       FROM products p JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="products_${Date.now()}.csv"`);

    const csvStream = fastCsv.format({ headers: true });
    csvStream.pipe(res);
    for (const r of rows) {
      csvStream.write(r);
    }
    csvStream.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating CSV' });
  }
};

// Stream XLSX (using exceljs streaming)
exports.reportXLSX = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.image_url AS image, p.price, c.name AS category
       FROM products p JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="products_${Date.now()}.xlsx"`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const sheet = workbook.addWorksheet('Products');
    sheet.addRow(['id', 'name', 'image', 'price', 'category']).commit();
    for (const r of rows) {
      sheet.addRow([r.id, r.name, r.image, r.price, r.category]).commit();
    }
    await workbook.commit();
    // response will end when stream ends
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating XLSX' });
  }
};
