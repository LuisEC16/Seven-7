const express = require('express');
const router = express.Router();
const { addToCart, viewCart,removeFromCart,updateCantidad,updateTalla } = require('../controllers/cartcontroller');
const { isAuthenticated } = require('../middlewares');

// Ruta para ver el carrito
router.get('/', isAuthenticated, viewCart);

// Ruta para añadir un producto al carrito
router.post('/add/:id', isAuthenticated, addToCart);
router.post('/remove-from-cart/:id', isAuthenticated, removeFromCart);
router.post('/update-talla', isAuthenticated, updateTalla);
router.post('/update-cantidad', isAuthenticated, updateCantidad);

module.exports = router;
