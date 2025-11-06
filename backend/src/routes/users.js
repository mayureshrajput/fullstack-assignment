const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctl = require('../controllers/usersController');

router.get('/me', auth, ctl.me);
router.put('/me', auth, ctl.updateMe);

module.exports = router;
