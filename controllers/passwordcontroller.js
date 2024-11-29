const { db } = require('../config/database');
const crypto = require('crypto'); // Utiliza el módulo integrado de Node.js
const nodemailer = require('nodemailer');
const async = require('async');

// Configurar el transporte de nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'sevenservices261@gmail.com',
        pass: 'wrdw tfel houa jrkj'
    }
});

const renderForgotPassword = (req, res) => {
    res.render('forgot', { error: req.flash('error'), message: req.flash('message') });
};

const forgotPassword = (req, res, next) => {
    async.waterfall([
        (done) => {
            crypto.randomBytes(20, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        (token, done) => {
            const email = req.body.email;
            db.query('SELECT * FROM usuarios WHERE Email = ?', [email], (err, results) => {
                if (err || results.length === 0) {
                    req.flash('error', 'No se encontró una cuenta con esa dirección de correo electrónico.');
                    return res.redirect('/password/forgot');
                }

                const user = results[0];
                const expires = new Date(Date.now() + 3600000); // 1 hora

                db.query('UPDATE usuarios SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE ID = ?', [token, expires, user.ID], (err) => {
                    done(err, token, user);
                });
            });
        },
        (token, user, done) => {
            const mailOptions = {
                to: user.Email,
                from: 'sevenservices261@gmail.com',
                subject: 'Restablecimiento de contraseña',
                text: `Recibiste este correo porque tú (o alguien más) solicitó restablecer la contraseña de tu cuenta.\n\n` +
                      `Por favor, haz clic en el siguiente enlace, o pégalo en tu navegador para completar el proceso:\n\n` +
                      `http://${req.headers.host}/password/reset/${token}\n\n` +
                      `Si no solicitaste esto, ignora este correo y tu contraseña no cambiará.\n`
            };

            transporter.sendMail(mailOptions, (err) => {
                req.flash('message', 'Se envió un correo con más instrucciones a ' + user.Email + '.');
                done(err, 'done');
            });
        }
    ], (err) => {
        if (err) return next(err);
        res.redirect('/password/forgot');
    });
};

const renderResetPassword = (req, res) => {
    const token = req.params.token;
    db.query('SELECT * FROM usuarios WHERE resetPasswordToken = ? AND resetPasswordExpires > ?', [token, new Date()], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error', 'El token de restablecimiento de contraseña es inválido o ha expirado.');
            return res.redirect('/password/forgot');
        }
        res.render('reset', { token, error: req.flash('error'), message: req.flash('message') });
    });
};

const resetPassword = (req, res, next) => {
    async.waterfall([
        (done) => {
            const token = req.params.token;
            db.query('SELECT * FROM usuarios WHERE resetPasswordToken = ? AND resetPasswordExpires > ?', [token, new Date()], (err, results) => {
                if (err || results.length === 0) {
                    req.flash('error', 'El token de restablecimiento de contraseña es inválido o ha expirado.');
                    return res.redirect('back');
                }

                const user = results[0];
                const newPassword = req.body.password;
                db.query('UPDATE usuarios SET Contrasena = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE ID = ?', [newPassword, user.ID], (err) => {
                    done(err, user);
                });
            });
        },
        (user, done) => {
            const mailOptions = {
                to: user.Email,
                from: 'sevenservices261@gmail.com',
                subject: 'Tu contraseña ha sido cambiada',
                text: `Hola,\n\n` +
                      `Esta es una confirmación de que la contraseña de tu cuenta ${user.Email} ha sido cambiada.\n`
            };

            transporter.sendMail(mailOptions, (err) => {
                req.flash('message', 'Tu contraseña ha sido actualizada.');
                done(err);
            });
        }
    ], (err) => {
        if (err) return next(err);
        res.redirect('/');
    });
};

module.exports = {
    renderForgotPassword,
    forgotPassword,
    renderResetPassword,
    resetPassword
};