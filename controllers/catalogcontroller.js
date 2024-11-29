const { db } = require('../config/database');

const getProductsByCategory = (category, callback) => {
    let sql = `
        SELECT p.*, pi.Imagen, t.Talla, pt.Stock
        FROM productos p
        LEFT JOIN producto_imagenes pi ON p.ID_productos = pi.ID_productos
        LEFT JOIN producto_tallas pt ON p.ID_productos = pt.producto_ID
        LEFT JOIN tallas t ON pt.talla_ID = t.ID
    `;
    if (category) {
        if (category === 'descuentos') {
            sql += ' WHERE p.Descuento > 0';
        } else {
            sql += ' WHERE p.Categoria = ?';
        }
    }
    db.query(sql, [category], (err, results) => {
        if (err) {
            console.error('Error al obtener los productos del catálogo:', err);
            callback(err, null);
        } else {
            const productsMap = {};
            results.forEach(row => {
                if (!productsMap[row.ID_productos]) {
                    productsMap[row.ID_productos] = {
                        ID_productos: row.ID_productos,
                        Nombre: row.Nombre,
                        Descripcion: row.Descripcion,
                        Precio: row.Precio,
                        Categoria: row.Categoria,
                        Descuento: row.Descuento,
                        Imagen: row.Imagen,
                        tallas: []
                    };
                }
                productsMap[row.ID_productos].tallas.push({
                    Talla: row.Talla,
                    Stock: row.Stock
                });
            });
            callback(null, Object.values(productsMap));
        }
    });
};

const catalog = (req, res) => {
    getProductsByCategory(null, (err, products) => {
        if (err) {
            req.flash('errorMessage', 'Error interno al obtener los productos del catálogo');
            return res.redirect('/');
        }
        res.render('catalog', { products });
    });
};

const filterProducts = (req, res) => {
    const category = req.query.category || null;
    getProductsByCategory(category, (err, products) => {
        if (err) {
            return res.status(500).json({ error: 'Error interno al obtener los productos del catálogo' });
        }
        res.json(products);
    });
};

module.exports = {
    catalog,
    filterProducts
};
