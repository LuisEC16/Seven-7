const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registercontroller');

// Ruta para la página de registro
router.get('/', (req, res) => {
    const error = req.flash('error');
    const message = req.flash('message');
    res.render('register', { error, message });
});

// Ruta para manejar el registro de usuarios
router.post('/', registerController.register);
router.post('/register', registerController.register);
router.get('/validate/:token', registerController.validateUser);
router.get('/activate/:token', registerController.activateUser); // Ruta para activar la cuenta
router.get('/account-activated', (req, res) => {
    res.render('account-activated'); // Nueva vista para la confirmación de activación
});
module.exports = router;
