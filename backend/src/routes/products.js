const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const ctl = require('../controllers/productsController');

router.post('/', auth, ctl.createProduct);
router.get('/', ctl.listProducts);
router.get('/:id', ctl.getProduct);
router.put('/:id', auth, ctl.updateProduct);
router.delete('/:id', auth, ctl.deleteProduct);

// Bulk upload CSV
router.post('/bulk-upload', auth, upload.single('file'), ctl.bulkUploadCSV);

// Reports
router.get('/report/csv', auth, ctl.reportCSV);
router.get('/report/xlsx', auth, ctl.reportXLSX);

module.exports = router;
