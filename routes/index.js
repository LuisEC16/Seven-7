const express = require('express');
const router = express.Router();

// Ruta para la página principal
router.get('/', (_req, res) => {
    res.render('index'); // Aquí renderizamos la vista index.ejs
});

module.exports = router;
