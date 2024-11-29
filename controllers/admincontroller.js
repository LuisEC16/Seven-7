const { db } = require('../config/database'); // Importamos la conexión a la base de datos

const login = (req, res) => {
    const { Usuario, Contrasena } = req.body;
    console.log('Datos recibidos:', { Usuario, Contrasena });

    const sql = `SELECT * FROM administrador WHERE Usuario = ? AND Contrasena = ?`;
    db.query(sql, [Usuario, Contrasena], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta', err);
            res.status(500).send('Error interno del servidor');
            return;
        }

        if (results.length === 0) {
            console.log('Usuario no encontrado o contraseña incorrecta');
            res.render('admin/login', { message: null, error: 'Usuario o contraseña incorrectos' });
        } else {
            console.log('Inicio de sesión exitoso');
            req.session.adminLoggedIn = true; // Establecer la sesión del administrador
            console.log('Redirigiendo al dashboard');
            res.redirect('/admin/dashboard');
        }
    });
};

// Función para mostrar el dashboard del administrador
const dashboard = (req, res) => {
    console.log('Accediendo al dashboard');
    if (!req.session.adminLoggedIn) {
        console.log('No hay sesión de administrador, redirigiendo a /admin/login');
        res.redirect('/admin/login');
        return;
    }
    console.log('Sesión de administrador válida, renderizando el dashboard');
    res.render('admin/dashboard', { message: null });
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        res.redirect('/admin/login');
    });
};

const manageUsers = (req, res) => {
    if (!req.session.adminLoggedIn) {
        res.redirect('/admin/login');
        return;
    }

    const sql = `SELECT id, Nombre_Apellido FROM usuarios`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios', err);
            res.status(500).send('Error interno del servidor');
            return;
        }

        res.render('admin/manage-users', { users: results });
    });
};

const editUsers = (req, res) => {
    const selectedUsers = req.body.selectedUsers;
    if (!selectedUsers) {
        res.redirect('/admin/manage-users');
        return;
    }

    const sql = `SELECT * FROM usuarios WHERE ID IN (?)`;
    db.query(sql, [selectedUsers], (err, results) => {
        if (err) {
            console.error('Error al obtener los usuarios para editar', err);
            res.status(500).send('Error interno del servidor');
            return;
        }

        res.render('admin/edit-users', { users: results });
    });
};

const deleteUsers = (req, res) => {
    const selectedUsers = req.body.selectedUsers;
    if (!selectedUsers) {
        req.flash('error', 'No se seleccionaron usuarios para eliminar');
        res.redirect('/admin/manage-users');
        return;
    }

    const sql = `DELETE FROM usuarios WHERE id IN (?)`;
    db.query(sql, [selectedUsers], (err, result) => {
        if (err) {
            console.error('Error al eliminar usuarios', err);
            req.flash('error', 'Error interno al eliminar usuarios');
            res.redirect('/admin/manage-users');
            return;
        }

        const numDeleted = result.affectedRows;
        req.flash('success', `Se eliminaron exitosamente ${numDeleted} usuarios`);
        res.redirect('/admin/manage-users');
    });
};

const updateUser = (req, res) => {
    const { ID, Nombre_Apellido, Email, Direccion, Contrasena } = req.body;

    if (!ID) {
        console.error('ID no proporcionado en la solicitud');
        req.flash('error', 'ID no proporcionado');
        return res.redirect('/admin/manage-users');
    }

    let sql;
    let params;

    if (Contrasena) {
        sql = `UPDATE usuarios SET Nombre_Apellido = ?, Email = ?, Direccion = ?, Contrasena = ? WHERE ID = ?`;
        params = [Nombre_Apellido, Email, Direccion, Contrasena, ID];
    } else {
        sql = `UPDATE usuarios SET Nombre_Apellido = ?, Email = ?, Direccion = ? WHERE ID = ?`;
        params = [Nombre_Apellido, Email, Direccion, ID];
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error al actualizar usuario:', err);
            req.flash('error', 'Error al actualizar usuario');
            res.redirect('/admin/manage-users');
            return;
        }

        if (result.affectedRows === 0) {
            console.error('No se encontró el usuario con el ID proporcionado');
            req.flash('error', 'No se encontró el usuario con el ID proporcionado');
            res.redirect('/admin/manage-users');
            return;
        }

        req.flash('success', 'Usuario actualizado correctamente');
        res.redirect('/admin/manage-users');
    });
};

const manageInventory = (req, res) => {
    const sql = `SELECT * FROM productos`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener inventario', err);
            return res.status(500).send('Error interno del servidor');
        }

        res.render('admin/manage-inventory', {
            products: results,
            successMessage: req.flash('successMessage'),
            errorMessage: req.flash('errorMessage')
        });
    });
};

const viewPayments = (req, res) => {
    const query = `
        SELECT c.ID_Comprobante, c.Fecha, c.Total, c.Numero_Telefonico, c.pago, c.entrega, c.descripcion, c.Estado, u.Nombre_Apellido AS Usuario
        FROM comprobante c
        JOIN usuarios u ON c.Usuario_ID = u.ID
        ORDER BY u.Nombre_Apellido
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
    const query = 'UPDATE comprobante SET Estado = ? WHERE ID_Comprobante = ?';
    db.query(query, [estado, id_comprobante], (err) => {
        if (err) {
            console.error('Error al actualizar el estado:', err);
            return res.status(500).send('Error al actualizar el estado');
        }
        res.redirect('/admin/payments');
    });
};

module.exports = {
    login,
    dashboard,
    logout,
    manageUsers,
    editUsers,
    deleteUsers,
    updateUser,
    manageInventory,
    viewPayments,
    updatePaymentStatus
};
