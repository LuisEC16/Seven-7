const { db } = require('../config/database');

const addToCart = (req, res) => {
    const productId = req.params.id;
    const userId = req.session.userId;
    const { talla } = req.body;

    if (!userId) {
        req.flash('error', 'Debes iniciar sesión para añadir productos al carrito');
        return res.redirect('/login');
    }

    if (!talla) {
        req.flash('error', 'Debes seleccionar una talla antes de añadir al carrito');
        return res.redirect('/catalog');
    }

    const checkProductQuery = `
        SELECT * FROM carrito_productos 
        WHERE ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?) 
        AND ID_Productos = ? 
        AND Talla = ?
    `;

    db.query(checkProductQuery, [userId, productId, talla], (err, results) => {
        if (err) {
            console.error('Error al verificar el producto en el carrito:', err);
            return res.status(500).send('Error interno al añadir el producto al carrito');
        }

        if (results.length > 0) {
            const updateQuantityQuery = `
                UPDATE carrito_productos 
                SET Cantidad = Cantidad + 1 
                WHERE ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?) 
                AND ID_Productos = ? 
                AND Talla = ?
            `;

            db.query(updateQuantityQuery, [userId, productId, talla], (err) => {
                if (err) {
                    console.error('Error al actualizar la cantidad del producto en el carrito:', err);
                    return res.status(500).send('Error interno al actualizar la cantidad del producto en el carrito');
                }
                res.redirect('/cart');
            });
        } else {
            const addProductQuery = `
                INSERT INTO carrito_productos (ID_carrito, ID_Productos, Cantidad, Talla) 
                VALUES ((SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?), ?, 1, ?)
            `;

            db.query(addProductQuery, [userId, productId, talla], (err) => {
                if (err) {
                    console.error('Error al añadir el producto al carrito:', err);
                    return res.status(500).send('Error interno al añadir el producto al carrito');
                }
                res.redirect('/cart');
            });
        }
    });
};

const viewCart = (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        req.flash('error', 'Debes iniciar sesión para ver el carrito');
        return res.redirect('/login');
    }

    const getProductIdsQuery = `
        SELECT ID_Productos 
        FROM carrito_productos 
        WHERE ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?)
    `;

    db.query(getProductIdsQuery, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener los productos del carrito:', err);
            return res.status(500).send('Error interno al obtener los productos del carrito');
        }

        const productIds = results.map(row => row.ID_Productos);

        if (productIds.length === 0) {
            return res.render('cart', { products: [], total: 0, usuario_id: userId });
        }

        const getProductsQuery = `
            SELECT p.*, c.Cantidad, c.Talla, pi.Imagen 
            FROM carrito_productos c 
            JOIN productos p ON c.ID_Productos = p.ID_productos 
            LEFT JOIN producto_imagenes pi ON p.ID_productos = pi.ID_productos 
            WHERE c.ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?)
        `;

        db.query(getProductsQuery, [userId], (err, products) => {
            if (err) {
                console.error('Error al obtener los productos del carrito:', err);
                return res.status(500).send('Error interno al obtener los productos del carrito');
            }

            const total = products.reduce((sum, product) => {
                const price = product.Descuento > 0 ? product.Precio - (product.Precio * (product.Descuento / 100)) : product.Precio;
                return sum + (price * product.Cantidad);
            }, 0);

            const getTallasQuery = `
                SELECT pt.producto_ID, t.Talla, pt.Stock
                FROM producto_tallas pt
                JOIN tallas t ON pt.talla_ID = t.ID
                WHERE pt.producto_ID IN (?)
            `;

            db.query(getTallasQuery, [productIds], (err, tallas) => {
                if (err) {
                    console.error('Error al obtener las tallas:', err);
                    return res.status(500).send('Error interno al obtener las tallas');
                }

                const productsWithTallas = products.map(product => {
                    return {
                        ...product,
                        tallas: tallas.filter(talla => talla.producto_ID === product.ID_productos)
                    };
                });

                res.render('cart', { products: productsWithTallas, total, usuario_id: userId });
            });
        });
    });
};




const removeFromCart = (req, res) => {
    const productId = req.params.id;
    const userId = req.session.userId;

    if (!userId) {
        req.flash('error', 'Debes iniciar sesión para eliminar productos del carrito');
        return res.redirect('/login');
    }

    const removeProductQuery = `
        DELETE FROM carrito_productos 
        WHERE ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?) 
        AND ID_Productos = ?
    `;

    db.query(removeProductQuery, [userId, productId], (err) => {
        if (err) {
            console.error('Error al eliminar el producto del carrito:', err);
            return res.status(500).send('Error interno al eliminar el producto del carrito');
        }
        res.redirect('/cart');
    });
};

const updateTalla = (req, res) => {
    const { productId, talla } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Debes iniciar sesión para actualizar la talla' });
    }

    const updateTallaQuery = `
        UPDATE carrito_productos 
        SET Talla = ? 
        WHERE ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?) 
        AND ID_Productos = ?
    `;

    db.query(updateTallaQuery, [talla, userId, productId], (err) => {
        if (err) {
            console.error('Error al actualizar la talla del producto en el carrito:', err);
            return res.status(500).json({ success: false, message: 'Error interno al actualizar la talla del producto en el carrito' });
        }
        res.json({ success: true });
    });
};

const updateCantidad = (req, res) => {
    const { productId, cantidad } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Debes iniciar sesión para actualizar la cantidad' });
    }

    // Verificar el stock antes de actualizar la cantidad
    const checkStockQuery = `
        SELECT Stock 
        FROM producto_tallas pt 
        JOIN carrito_productos cp ON pt.producto_ID = cp.ID_Productos AND pt.talla_ID = (SELECT ID FROM tallas WHERE Talla = cp.Talla) 
        WHERE cp.ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?) 
        AND cp.ID_Productos = ?
    `;

    db.query(checkStockQuery, [userId, productId], (err, results) => {
        if (err) {
            console.error('Error al verificar el stock del producto:', err);
            return res.status(500).json({ success: false, message: 'Error interno al verificar el stock del producto' });
        }

        if (results.length > 0 && results[0].Stock >= cantidad) {
            const updateCantidadQuery = `
                UPDATE carrito_productos 
                SET Cantidad = ? 
                WHERE ID_carrito = (SELECT ID_carrito FROM carrito_de_compras WHERE Usuario_ID = ?) 
                AND ID_Productos = ?
            `;

            db.query(updateCantidadQuery, [cantidad, userId, productId], (err) => {
                if (err) {
                    console.error('Error al actualizar la cantidad del producto en el carrito:', err);
                    return res.status(500).json({ success: false, message: 'Error interno al actualizar la cantidad del producto en el carrito' });
                }
                res.json({ success: true });
            });
        } else {
            res.status(400).json({ success: false, message: 'No hay suficiente stock para la cantidad solicitada' });
        }
    });
};

module.exports = {
    addToCart,
    viewCart,
    removeFromCart,
    updateTalla,
    updateCantidad
};
