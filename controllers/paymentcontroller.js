const { db } = require('../config/database');

const viewPayments = (req, res) => {
    const query = `
        SELECT c.ID_Comprobante, c.Fecha, c.Total, c.Numero_Telefonico, c.pago, c.entrega, c.descripcion, c.Estado, u.Nombre_Apellido AS Usuario
        FROM comprobante c
        JOIN usuarios u ON c.Usuario_ID = u.ID
        ORDER BY c.Fecha DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los pagos:', err);
            return res.status(500).send('Error al obtener los pagos');
        }
        res.render('admin/payments', { payments: results });
    });
};

const updatePaymentStatus = (req, res) => {
    const { id_comprobante, estado } = req.body;
    const querySelect = 'SELECT Estado, descripcion FROM comprobante WHERE ID_Comprobante = ?';
    db.query(querySelect, [id_comprobante], (err, results) => {
        if (err) {
            console.error('Error al obtener el estado actual:', err);
            return res.status(500).send('Error al obtener el estado actual');
        }
        if (results.length === 0) {
            console.error('No se encontró el comprobante con el ID especificado');
            return res.status(404).send('No se encontró el comprobante con el ID especificado');
        }
        const currentState = results[0].Estado;
        const descripcion = results[0].descripcion;

        if (currentState === 'En proceso') {
            if (estado === 'Finalizada' && descripcion) {
                console.log('Descripción del pedido:', descripcion);
                const productos = descripcion.split(', '); // Asegúrate de que los productos estén separados por comas en la descripción
                let errorUpdatingStock = false;

                productos.forEach((producto, index) => {
                    const partes = producto.split(' - ');
                    const nombre = partes[0].trim();
                    const talla = partes[2].split(': ')[1].trim();
                    const cantidadString = partes[3].split(':')[1].trim();
                    const cantidad = parseInt(cantidadString);

                    console.log('Producto:', producto);
                    console.log('Nombre:', nombre);
                    console.log('Talla:', talla);
                    console.log('Cantidad:', cantidad);

                    if (!isNaN(cantidad)) {
                        const queryProductoId = `
                            SELECT p.ID_productos as producto_ID, t.ID as talla_ID
                            FROM productos p
                            JOIN producto_tallas pt ON pt.producto_ID = p.ID_productos
                            JOIN tallas t ON t.ID = pt.talla_ID
                            WHERE p.Nombre = ? AND t.Talla = ?
                        `;
                        db.query(queryProductoId, [nombre, talla], (err, results) => {
                            if (err) {
                                console.error('Error al obtener IDs de producto y talla:', err);
                                errorUpdatingStock = true;
                                return;
                            }
                            if (results.length > 0) {
                                const producto_ID = results[0].producto_ID;
                                const talla_ID = results[0].talla_ID;

                                const queryStockUpdate = `
                                    UPDATE producto_tallas 
                                    SET Stock = Stock - ? 
                                    WHERE producto_ID = ? 
                                    AND talla_ID = ?
                                `;
                                console.log('Ejecutando queryStockUpdate con parámetros:', [cantidad, producto_ID, talla_ID]);
                                db.query(queryStockUpdate, [cantidad, producto_ID, talla_ID], (err, result) => {
                                    if (err) {
                                        console.error('Error al actualizar el stock:', err);
                                        errorUpdatingStock = true;
                                        return;
                                    }
                                    if (result.affectedRows > 0) {
                                        console.log('Stock actualizado correctamente para el producto:', nombre);
                                        if (index === productos.length - 1 && !errorUpdatingStock) {
                                            const queryUpdate = 'UPDATE comprobante SET Estado = ? WHERE ID_Comprobante = ?';
                                            db.query(queryUpdate, [estado, id_comprobante], (err) => {
                                                if (err) {
                                                    console.error('Error al actualizar el estado:', err);
                                                    return res.status(500).send('Error al actualizar el estado');
                                                }
                                                res.redirect('/admin/payments');
                                            });
                                        }
                                    } else {
                                        console.log('No se encontró el producto o la talla para actualizar el stock');
                                        errorUpdatingStock = true;
                                    }
                                });
                            } else {
                                console.error('No se encontró el producto o la talla especificados');
                                errorUpdatingStock = true;
                            }
                        });
                    } else {
                        console.error('Cantidad no es un número válido:', cantidadString);
                        errorUpdatingStock = true;
                    }
                });

                if (errorUpdatingStock) {
                    return res.status(500).send('Error al actualizar el stock. El estado no se ha cambiado a Finalizada.');
                }
            } else {
                const queryUpdate = 'UPDATE comprobante SET Estado = ? WHERE ID_Comprobante = ?';
                db.query(queryUpdate, [estado, id_comprobante], (err) => {
                    if (err) {
                        console.error('Error al actualizar el estado:', err);
                        return res.status(500).send('Error al actualizar el estado');
                    }
                    res.redirect('/admin/payments');
                });
            }
        } else {
            res.redirect('/admin/payments');
        }
    });
};

module.exports = {
    viewPayments,
    updatePaymentStatus
};
