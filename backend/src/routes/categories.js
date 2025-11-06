const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctl = require('../controllers/categoriesController');

router.post('/', auth, ctl.createCategory);
router.get('/', ctl.listCategories);
router.get('/:id', ctl.getCategory);
router.put('/:id', auth, ctl.updateCategory);
router.delete('/:id', auth, ctl.deleteCategory);

module.exports = router;
