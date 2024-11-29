const { db } = require('../config/database');
const crypto = require('crypto');
const transporter = require('../config/nodemailer');

const renderProfilePage = (req, res) => {
    const Usuario_ID = req.session.userId;
    const sql = 'SELECT * FROM comprobante WHERE Usuario_ID = ?';

    db.query(sql, [Usuario_ID], (err, comprobante) => {
        if (err) {
            console.error('Error al obtener el historial de compras:', err);
            req.flash('errorMessage', 'Error al obtener el historial de compras');
            comprobante = [];
        }

        db.query('SELECT validationToken, validationTokenExpires FROM usuarios WHERE ID = ?', [Usuario_ID], (err, result) => {
            if (err) {
                console.error('Error al obtener el token de validación:', err);
                req.flash('errorMessage', 'Error al obtener el token de validación');
                result = [{ validationToken: null, validationTokenExpires: null }];
            }

            res.render('profile', {
                Usuario_ID: req.session.userId,
                userName: req.session.userName,
                userLastName: req.session.userLastName,
                userEmail: req.session.userEmail,
                userAddress: req.session.userAddress,
                userJoinDate: req.session.userJoinDate,
                successMessage: req.flash('successMessage'),
                errorMessage: req.flash('errorMessage'),
                comprobante: comprobante,
                validationToken: result[0].validationToken,
                validationTokenExpires: result[0].validationTokenExpires
            });
        });
    });
};

const updateProfile = (req, res) => {
    const { userName, userLastName, userEmail, userAddress, userPassword } = req.body;

    db.query('SELECT Email, Contrasena FROM usuarios WHERE ID = ?', [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error al verificar el correo actual:', err);
            req.flash('errorMessage', 'Error al verificar el correo actual');
            return res.redirect('/profile');
        }

        const currentEmail = results[0].Email;
        const currentPassword = results[0].Contrasena;

        if (userEmail !== currentEmail) {
            const validationToken = crypto.randomBytes(20).toString('hex');
            const validationTokenExpires = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' '); // 1 hora

            // Guardar el nuevo correo en la sesión
            req.session.newEmail = userEmail;

            db.query('UPDATE usuarios SET validationToken = ?, validationTokenExpires = ? WHERE ID = ?', 
            [validationToken, validationTokenExpires, req.session.userId], (err) => {
                if (err) {
                    console.error('Error al actualizar el perfil:', err);
                    req.flash('errorMessage', 'Error al actualizar el perfil');
                    return res.redirect('/profile');
                }

                // Enviar correo de confirmación
                const mailOptions = {
                    to: userEmail,
                    from: 'sevenservices261@gmail.com',
                    subject: 'Confirma tu cambio de correo',
                    text: `Has solicitado cambiar tu correo. Por favor, haz clic en el siguiente enlace para confirmar el cambio:\n\n
                    http://${req.headers.host}/profile/confirm-email/${validationToken}\n\n
                    Si no solicitaste este cambio, por favor ignora este correo.\n`
                };

                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.error('Error al enviar el correo de confirmación:', err);
                        req.flash('errorMessage', 'Error al enviar el correo de confirmación');
                        return res.redirect('/profile');
                    }
                    req.session.validationToken = validationToken;
                    req.flash('successMessage', 'Se ha enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada.');
                    res.redirect('/profile');
                });
            });
        } else {
            let sql = 'UPDATE usuarios SET Nombre_Apellido = ?, Direccion = ? WHERE ID = ?';
            const params = [`${userName} ${userLastName}`, userAddress, req.session.userId];

            if (userPassword) {
                sql = 'UPDATE usuarios SET Nombre_Apellido = ?, Direccion = ?, Contrasena = ? WHERE ID = ?';
                params.splice(2, 0, userPassword);
            }

            db.query(sql, params, (err, results) => {
                if (err) {
                    console.error('Error al actualizar la información del usuario:', err);
                    req.flash('errorMessage', 'Error al actualizar la información');
                    return res.redirect('/profile');
                }

                req.session.userName = userName;
                req.session.userLastName = userLastName;
                req.session.userEmail = userEmail;
                req.session.userAddress = userAddress;
                req.flash('successMessage', 'Información actualizada correctamente');
                res.redirect('/profile');
            });
        }
    });
};

const confirmEmailChange = (req, res) => {
    const { token } = req.params;

    db.query('SELECT * FROM usuarios WHERE validationToken = ? AND validationTokenExpires > ?', [token, new Date().toISOString().slice(0, 19).replace('T', ' ')], (err, results) => {
        if (err) {
            console.error('Error al validar el token:', err);
            req.flash('errorMessage', 'Error al validar el token');
            return res.redirect('/profile');
        }

        if (results.length === 0) {
            req.flash('errorMessage', 'El token es inválido o ha expirado');
            return res.redirect('/profile');
        }

        const userId = results[0].ID;
        const newEmail = req.session.newEmail; // Usar el correo nuevo almacenado en la sesión

        console.log(`User ID: ${userId}, New Email: ${newEmail}`);

        // Actualizar el correo y eliminar los tokens en una sola consulta
        db.query('UPDATE usuarios SET Email = ?, validationToken = NULL, validationTokenExpires = NULL WHERE validationToken = ?', 
        [newEmail, token], (err) => {
            if (err) {
                console.error('Error al confirmar el cambio de correo:', err);
                req.flash('errorMessage', 'Error al confirmar el cambio de correo');
                return res.redirect('/profile');
            }

            console.log('Correo actualizado y tokens eliminados');
            req.session.userEmail = newEmail; // Actualizar el correo en la sesión
            req.session.validationToken = null;
            req.session.newEmail = null; // Limpiar el correo nuevo de la sesión
            req.flash('successMessage', 'Cambio de correo confirmado exitosamente');
            res.redirect('/profile');
        });
    });
};

const deleteAccount = (req, res) => {
    const userId = req.session.userId;

    const sql = 'UPDATE usuarios SET activo = FALSE WHERE ID = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error al desactivar la cuenta:', err);
            req.flash('errorMessage', 'Error interno al desactivar la cuenta');
            return res.redirect('/profile');
        }

        req.flash('successMessage', 'Su cuenta ha sido eliminada exitosamente.');
        res.redirect('/logout');
    });
};

module.exports = {
    renderProfilePage,
    updateProfile,
    confirmEmailChange,
    deleteAccount
};
