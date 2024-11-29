const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordcontroller');

// Ruta para solicitar restablecimiento de contraseña
router.get('/forgot', passwordController.renderForgotPassword);
router.post('/forgot', passwordController.forgotPassword);

// Ruta para restablecer contraseña
router.get('/reset/:token', passwordController.renderResetPassword);
router.post('/reset/:token', passwordController.resetPassword);

module.exports = router;
