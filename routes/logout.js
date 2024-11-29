const express = require('express');
const router = express.Router();
const logoutController = require('../controllers/logoutcontroller');

// Ruta para el cierre de sesión de usuarios
router.get('/', logoutController.logout);

// Ruta para el cierre de sesión de administradores
router.get('/admin', logoutController.adminLogout);

module.exports = router;
