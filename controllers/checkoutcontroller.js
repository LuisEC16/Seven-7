const { db } = require('../config/database');

const renderCheckout = (req, res) => {
    const userId = req.session.userId;
    const sql = `
        SELECT cp.*, p.Nombre, p.Precio, p.Descuento, p.Categoria, pi.Imagen, cp.Talla
        FROM carrito_productos cp 
        JOIN productos p ON cp.ID_Productos = p.ID_productos 
        LEFT JOIN producto_imagenes pi ON p.ID_productos = pi.ID_productos 
        WHERE cp.ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?)
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener los productos del carrito:', err);
            req.flash('errorMessage', 'Error interno al obtener los productos del carrito');
            return res.redirect('/');
        }
        res.render('checkout', { products: results, usuario_id: userId });
    });
};

const processPayment = (req, res) => {
    const { total, codigo, telefono, forma_pago, forma_entrega, usuario_id, descripcion } = req.body;
    const numero_telefonico = `${codigo}${telefono}`; // Combina el código y el teléfono

    const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Inserta el comprobante en la base de datos
    const query = 'INSERT INTO comprobante (Fecha, Total, Numero_Telefonico, pago, entrega, Usuario_ID, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [fechaActual, total, numero_telefonico, forma_pago, forma_entrega, usuario_id, descripcion], (err, result) => {
        if (err) {
            console.error('Error al procesar el pago:', err);
            return res.status(500).send('Error al procesar el pago');
        }

        // Vaciar el carrito después de insertar el comprobante
        const emptyCartQuery = `
            DELETE FROM carrito_productos 
            WHERE ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?)
        `;
        db.query(emptyCartQuery, [usuario_id], (err, result) => {
            if (err) {
                console.error('Error al vaciar el carrito:', err);
                return res.status(500).send('Error al vaciar el carrito');
            }
            res.redirect('/payment-success');
        });
    });
};

module.exports = {
    renderCheckout,
    processPayment
};
