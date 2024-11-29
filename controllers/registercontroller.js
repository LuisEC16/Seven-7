const { db } = require('../config/database');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const async = require('async');

// Configurar el transporte de nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'sevenservices261@gmail.com', // Reemplaza con tu correo
        pass: 'wrdw tfel houa jrkj' // Reemplaza con tu contraseña
    }
});

const register = (req, res, next) => {
    const { nombre, apellido, email, contrasena, direccion } = req.body;
    const nombreApellido = `${nombre} ${apellido}`;
    const fechaRegistro = new Date();

    const sqlCheckEmail = 'SELECT * FROM usuarios WHERE Email = ?';
    db.query(sqlCheckEmail, [email], (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            req.flash('error', 'Error al registrar usuario');
            return res.redirect('/register');
        }
        
        // Validación de la contraseña
        const passwordPattern = /^(?=.*[A-Z])(?=.*\W).{8,15}$/;
        if (!passwordPattern.test(contrasena)) {
            req.flash('error', 'La contraseña debe tener entre 8 y 15 caracteres, al menos una mayúscula y un signo.');
            return res.redirect('/register');
        }

        // Validación del nombre y apellido
        const namePattern = /^[a-zA-Z\s]+$/;
        if (!namePattern.test(nombre) || !namePattern.test(apellido)) {
            req.flash('error', 'El nombre y el apellido solo deben contener letras.');
            return res.redirect('/register');
        }

        if (results.length > 0) {
            // El correo ya existe, enviar correo de recuperación
            sendAccountRecoveryEmail(req, res, email);
        } else {
            // Proceder con el registro normal
            async.waterfall([
                (done) => {
                    crypto.randomBytes(20, (err, buf) => {
                        const token = buf.toString('hex');
                        done(err, token);
                    });
                },
                (token, done) => {
                    const newUser = {
                        Nombre_Apellido: nombreApellido,
                        Email: email,
                        Contrasena: contrasena,
                        Direccion: direccion,
                        Fecha: fechaRegistro,
                        validationToken: token,
                        validationTokenExpires: new Date(Date.now() + 3600000), // 1 hora
                        activo: true 
                    };

                    const sqlUser = 'INSERT INTO usuarios (Nombre_Apellido, Email, Contrasena, Direccion, Fecha, validationToken, validationTokenExpires, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                    const valuesUser = [newUser.Nombre_Apellido, newUser.Email, newUser.Contrasena, newUser.Direccion, newUser.Fecha, newUser.validationToken, newUser.validationTokenExpires, newUser.activo];

                    db.query(sqlUser, valuesUser, (err, result) => {
                        if (err) {
                            console.error('Error al registrar usuario', err);
                            req.flash('error', 'Error al registrar usuario');
                            res.redirect('/register');
                            return;
                        }

                        newUser.ID = result.insertId;
                        done(err, token, newUser);
                    });
                },
                (token, user, done) => {
                    const sqlCarrito = 'INSERT INTO carrito_de_compras (Fecha, Usuario_ID) VALUES (NOW(), ?)';
                    const valuesCarrito = [user.ID];

                    db.query(sqlCarrito, valuesCarrito, (err, result) => {
                        if (err) {
                            console.error('Error al crear el carrito de compras', err);
                            req.flash('error', 'Error al crear el carrito de compras');
                            res.redirect('/register');
                            return;
                        }

                        const mailOptions = {
                            to: user.Email,
                            from: 'sevenservices261@gmail.com',
                            subject: 'Activación de cuenta',
                            text: `Recibiste este correo porque te registraste en nuestra página.\n\n` +
                                  `Por favor, haz clic en el siguiente enlace, o pégalo en tu navegador para activar tu cuenta:\n\n` +
                                  `http://${req.headers.host}/register/activate/${token}\n\n` +
                                  `Si no solicitaste esto, ignora este correo.\n`
                        };

                        transporter.sendMail(mailOptions, (err) => {
                            if (err) {
                                console.error('Error al enviar el correo de activación', err);
                                req.flash('error', 'Error al enviar el correo de activación');
                                res.redirect('/register');
                                return;
                            }
                            req.flash('message', 'Se envió un correo con instrucciones de activación a ' + user.Email + '.');
                            done(null, 'done');
                        });
                    });
                }
            ], (err) => {
                if (err) return next(err);
                res.redirect('/register');
            });
        }
    });
};


const validateUser = (req, res, next) => {
    const token = req.params.token;

    db.query('SELECT * FROM usuarios WHERE validationToken = ? AND validationTokenExpires > ?', [token, new Date()], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error', 'El token de validación es inválido o ha expirado.');
            return res.redirect('/register');
        }

        const user = results[0];
        db.query('UPDATE usuarios SET validationToken = NULL, validationTokenExpires = NULL WHERE ID = ?', [user.ID], (err) => {
            if (err) {
                req.flash('error', 'Error al validar el usuario.');
                return res.redirect('/register');
            }

            req.flash('message', 'Cuenta validada exitosamente.');
            res.redirect('/login');
        });
    });
};

// Eliminar usuarios no validados
const deleteUnvalidatedUsers = () => {
    const now = new Date();
    db.query('DELETE FROM usuarios WHERE validationToken IS NOT NULL AND validationTokenExpires < ?', [now], (err) => {
        if (err) {
            console.error('Error al eliminar usuarios no validados:', err);
        }
    });
};

// Configurar la eliminación de usuarios no validados cada hora
setInterval(deleteUnvalidatedUsers, 3600000); // 1 hora


const activateUser = (req, res, next) => {
    const token = req.params.token;

    db.query('SELECT * FROM usuarios WHERE validationToken = ? AND validationTokenExpires > ?', [token, new Date()], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error', 'El token de activación es inválido o ha expirado.');
            return res.redirect('/register');
        }

        const user = results[0];
        db.query('UPDATE usuarios SET activo = TRUE, validationToken = NULL, validationTokenExpires = NULL WHERE ID = ?', [user.ID], (err) => {
            if (err) {
                req.flash('error', 'Error al activar la cuenta.');
                return res.redirect('/register');
            }

            // Renderizar la vista de cuenta activada
            res.render('account-activated');
        });
    });
};

const sendAccountRecoveryEmail = (req, res, email) => {
    async.waterfall([
        (done) => {
            crypto.randomBytes(20, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        (token, done) => {
            const sqlUpdate = 'UPDATE usuarios SET validationToken = ?, validationTokenExpires = ? WHERE Email = ?';
            const expires = new Date(Date.now() + 3600000); // 1 hora
            db.query(sqlUpdate, [token, expires, email], (err, results) => {
                if (err) {
                    console.error('Error al actualizar token:', err);
                    req.flash('error', 'Error al enviar correo de recuperación');
                    return res.redirect('/register');
                }

                const mailOptions = {
                    to: email,
                    from: 'sevenservices261@gmail.com',
                    subject: 'Reactivación de cuenta',
                    text: `Recibiste este correo porque intentaste registrarte en nuestra página y ya existe una cuenta con este correo.\n\n` +
                          `Por favor, haz clic en el siguiente enlace, o pégalo en tu navegador para reactivar tu cuenta:\n\n` +
                          `http://${req.headers.host}/register/activate/${token}\n\n` +
                          `Si no solicitaste esto, ignora este correo y no se realizará ningún cambio.\n`
                };

                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.error('Error al enviar el correo de reactivación:', err);
                        req.flash('error', 'Error al enviar correo de reactivación');
                        return res.redirect('/register');
                    }

                    req.flash('message', 'Se envió un correo con instrucciones de reactivación a ' + email + '.');
                    res.redirect('/register');
                });
            });
        }
    ]);
};
module.exports = {
    register,
    validateUser,
    activateUser,
    sendAccountRecoveryEmail
};
