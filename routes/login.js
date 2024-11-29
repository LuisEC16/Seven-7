const express = require('express');
const router = express.Router();
const loginController = require('../controllers/logincontroller');

// Ruta para la página de login
router.get('/', (req, res) => {
    res.render('login', { message: null, error: null });
});

// Ruta para procesar la solicitud de inicio de sesión
router.post('/', loginController.login);

module.exports = router;
