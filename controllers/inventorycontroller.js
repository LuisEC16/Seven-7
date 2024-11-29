const { db } = require('../config/database');
const fs = require('fs');
const path = require('path');
const upload = require('../config/multer');

// Función para añadir productos al inventario
const addProduct = (req, res) => {
    upload.single('imagen')(req, res, (err) => {
        if (err) {
            console.error('Error al subir la imagen', err);
            req.flash('errorMessage', 'Error al subir la imagen');
            return res.redirect('/admin/manage-inventory');
        }

        const { Nombre, Descripcion, Precio, Categoria, Descuento, stockXS, stockS, stockM, stockL, stockXL } = req.body;
        const imagen = req.file ? req.file.filename : null;

        // Validaciones
        if (!Nombre || Nombre.trim() === '') {
            req.flash('errorMessage', 'El nombre del producto no puede estar vacío');
            return res.redirect('/admin/manage-inventory');
        }
        if (isNaN(Precio) || Precio <= 0) {
            req.flash('errorMessage', 'El precio debe ser un número positivo mayor que 0');
            return res.redirect('/admin/manage-inventory');
        }
        if (isNaN(Descuento) || Descuento < 0) {
            req.flash('errorMessage', 'El descuento no puede ser un número negativo');
            return res.redirect('/admin/manage-inventory');
        }
        const tallas = [
            { talla: 'XS', stock: stockXS || 0 },
            { talla: 'S', stock: stockS || 0 },
            { talla: 'M', stock: stockM || 0 },
            { talla: 'L', stock: stockL || 0 },
            { talla: 'XL', stock: stockXL || 0 }
        ];
        for (const { stock } of tallas) {
            if (isNaN(stock) || stock < 0 || !Number.isInteger(Number(stock))) {
                req.flash('errorMessage', 'El stock debe ser un número entero no negativo');
                return res.redirect('/admin/manage-inventory');
            }
        }

        const sqlProducto = 'INSERT INTO productos (Nombre, Descripcion, Precio, Categoria, Descuento) VALUES (?, ?, ?, ?, ?)';
        const valuesProducto = [Nombre, Descripcion, Precio, Categoria, Descuento];

        db.query(sqlProducto, valuesProducto, (err, result) => {
            if (err) {
                console.error('Error al insertar producto en la base de datos', err);
                req.flash('errorMessage', 'Error al insertar producto en la base de datos');
                return res.redirect('/admin/manage-inventory');
            }

            const productId = result.insertId;
            const sqlImagen = 'INSERT INTO producto_imagenes (ID_productos, Imagen) VALUES (?, ?)';
            const valuesImagen = [productId, imagen];

            db.query(sqlImagen, valuesImagen, (err, result) => {
                if (err) {
                    console.error('Error al insertar imagen en la base de datos', err);
                    req.flash('errorMessage', 'Error al insertar imagen en la base de datos');
                    return res.redirect('/admin/manage-inventory');
                }

                const sqlTallas = `INSERT INTO producto_tallas (producto_ID, talla_ID, Stock)
                                   SELECT ?, ID, ? FROM tallas WHERE Talla = ?`;

                tallas.forEach(({ talla, stock }) => {
                    db.query(sqlTallas, [productId, stock, talla], (err, result) => {
                        if (err) {
                            console.error(`Error al insertar la talla ${talla} en la base de datos`, err);
                        }
                    });
                });

                console.log('Producto y tallas añadidos correctamente');
                req.flash('successMessage', 'Producto añadido con éxito');
                res.redirect('/admin/manage-inventory');
            });
        });
    });
};


// Función para eliminar productos del inventario
const deleteProduct = (req, res) => {
    const { id } = req.params;

    // Primero, obtenemos la imagen del producto para eliminarla del sistema de archivos
    let sql = 'SELECT Imagen FROM producto_imagenes WHERE ID_productos = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener la imagen del producto', err);
            req.flash('errorMessage', 'Error al obtener la imagen del producto');
            return res.redirect('/admin/manage-inventory');
        }

        const imagen = results[0].Imagen;

        // Eliminamos la imagen del sistema de archivos
        const imagePath = path.join(__dirname, '..', 'uploads', imagen);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error al eliminar la imagen del producto', err);
            }
        });

        // Luego, eliminamos el producto de la base de datos
        sql = 'DELETE FROM productos WHERE ID_productos = ?';
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar el producto', err);
                req.flash('errorMessage', 'Error al eliminar el producto');
                return res.redirect('/admin/manage-inventory');
            }

            req.flash('successMessage', 'Producto eliminado con éxito');
            res.redirect('/admin/manage-inventory');
        });
    });
};

// Función para mostrar el inventario actual
const manageInventory = (req, res) => {
    const sql = `
        SELECT 
            p.ID_productos, 
            p.Nombre, 
            p.Descripcion, 
            p.Precio, 
            p.Categoria, 
            p.Descuento, 
            i.Imagen,
            GROUP_CONCAT(CONCAT(t.Talla, ': ', pt.Stock) ORDER BY t.ID SEPARATOR ', ') AS StockPorTalla,
            SUM(pt.Stock) AS StockTotal
        FROM 
            productos p
        LEFT JOIN 
            producto_imagenes i ON p.ID_productos = i.ID_productos
        LEFT JOIN 
            producto_tallas pt ON p.ID_productos = pt.producto_ID
        LEFT JOIN 
            tallas t ON pt.talla_ID = t.ID
        WHERE pt.Stock > 0
        GROUP BY 
            p.ID_productos, p.Nombre, p.Descripcion, p.Precio, p.Categoria, p.Descuento, i.Imagen
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener inventario', err);
            return res.status(500).send('Error interno del servidor');
        }

        console.log('Resultado de la consulta del inventario:', results);

        res.render('admin/manage-inventory', {
            products: results,
            successMessage: req.flash('successMessage'),
            errorMessage: req.flash('errorMessage')
        });
    });
};


// Función para mostrar la página de edición de productos
const editProductPage = (req, res) => {
    const productId = req.params.id;
    const sqlProduct = 'SELECT * FROM productos WHERE ID_productos = ?';
    const sqlTallas = `SELECT t.Talla, pt.Stock 
                       FROM producto_tallas pt 
                       JOIN tallas t ON pt.talla_ID = t.ID 
                       WHERE pt.producto_ID = ?`;

    db.query(sqlProduct, [productId], (err, productResult) => {
        if (err) {
            console.error('Error al obtener el producto', err);
            req.flash('errorMessage', 'Error al obtener el producto');
            return res.redirect('/admin/manage-inventory');
        }
        if (productResult.length > 0) {
            db.query(sqlTallas, [productId], (err, tallasResult) => {
                if (err) {
                    console.error('Error al obtener las tallas del producto', err);
                    req.flash('errorMessage', 'Error al obtener las tallas del producto');
                    return res.redirect('/admin/manage-inventory');
                }
                res.render('admin/edit-product', { 
                    product: productResult[0], 
                    tallas: tallasResult 
                });
            });
        } else {
            req.flash('errorMessage', 'Producto no encontrado');
            res.redirect('/admin/manage-inventory');
        }
    });
};


// Función para actualizar el producto
const updateProduct = (req, res) => {
    const { id } = req.params;
    const { Nombre, Descripcion, Precio, Categoria, Descuento, stockXS, stockS, stockM, stockL, stockXL } = req.body;

    // Primero, actualizamos los datos del producto
    let sql = 'UPDATE productos SET Nombre = ?, Descripcion = ?, Precio = ?, Categoria = ?, Descuento = ? WHERE ID_productos = ?';
    let values = [Nombre, Descripcion, Precio, Categoria, Descuento, id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar el producto', err);
            req.flash('errorMessage', 'Error al actualizar el producto');
            return res.redirect('/admin/edit-product/' + id);
        }

        // Luego, actualizamos el stock de las tallas
        const tallas = [
            { talla: 'XS', stock: stockXS || 0 },
            { talla: 'S', stock: stockS || 0 },
            { talla: 'M', stock: stockM || 0 },
            { talla: 'L', stock: stockL || 0 },
            { talla: 'XL', stock: stockXL || 0 }
        ];

        const sqlTallas = `UPDATE producto_tallas pt
                           JOIN tallas t ON pt.talla_ID = t.ID
                           SET pt.Stock = ?
                           WHERE pt.producto_ID = ? AND t.Talla = ?`;

        tallas.forEach(({ talla, stock }) => {
            db.query(sqlTallas, [stock, id, talla], (err, result) => {
                if (err) {
                    console.error(`Error al actualizar el stock de la talla ${talla}`, err);
                }
            });
        });

        // Finalmente, manejamos la posible subida de una nueva imagen
        if (req.file) {
            const imagen = req.file.filename;
            sql = 'UPDATE producto_imagenes SET Imagen = ? WHERE ID_productos = ?';
            values = [imagen, id];

            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Error al actualizar la imagen del producto', err);
                    req.flash('errorMessage', 'Producto actualizado, pero hubo un error al actualizar la imagen');
                    return res.redirect('/admin/edit-product/' + id);
                }
                req.flash('successMessage', 'Producto actualizado con éxito');
                res.redirect('/admin/manage-inventory');
            });
        } else {
            req.flash('successMessage', 'Producto actualizado con éxito');
            res.redirect('/admin/manage-inventory');
        }
    });
};


module.exports = {
    addProduct,
    deleteProduct,
    manageInventory,
    editProductPage,
    updateProduct
};
