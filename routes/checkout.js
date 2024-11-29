const express = require('express');
const router = express.Router();
const { renderCheckout, processPayment } = require('../controllers/checkoutcontroller');

router.get('/', renderCheckout);
router.post('/process-payment', processPayment);

module.exports = router;
