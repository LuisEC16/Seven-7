const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogcontroller');

router.get('/', catalogController.catalog);
router.get('/filter', catalogController.filterProducts);

module.exports = router;
