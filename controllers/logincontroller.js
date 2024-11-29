const { db } = require('../config/database');
const fs = require('fs');
const path = require('path');
const upload = require('../config/multer');


const login = (req, res) => {
    const { Email, Contrasena } = req.body;
    console.log('Datos recibidos:', { Email, Contrasena });

    const sql = 'SELECT * FROM usuarios WHERE Email = ? AND activo = TRUE';
    db.query(sql, [Email], (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            req.flash('errorMessage', 'Error al iniciar sesión');
            return res.redirect('/login');
        }

        if (results.length === 0) {
            req.flash('errorMessage', 'Usuario no encontrado');
            console.log('Usuario no encontrado');
            return res.redirect('/login');
        }

        const user = results[0];
        console.log('Usuario encontrado:', user);

        if (Contrasena === user.Contrasena) {
            req.session.userLoggedIn = true;
            req.session.userId = user.ID;
            req.session.userName = user.Nombre_Apellido.split(' ')[0];
            req.session.userLastName = user.Nombre_Apellido.split(' ')[1];
            req.session.userEmail = user.Email;
            req.session.userAddress = user.Direccion;

            req.session.save(err => {
                if (err) {
                    console.error('Error al guardar la sesión:', err);
                    req.flash('errorMessage', 'Error al iniciar sesión');
                    return res.redirect('/login');
                }
                res.redirect('/profile');
            });
        } else {
            req.flash('errorMessage', 'Contraseña incorrecta');
            console.log('Contraseña incorrecta');
            res.redirect('/login');
        }
    });
};

const renderLoginPage = (req, res) => {
    res.render('login', {
        user: req.session.userLoggedIn ? {
            userName: req.session.userName,
            userId: req.session.userId,
            userEmail: req.session.userEmail,
            userAddress: req.session.userAddress,
            userJoinDate: req.session.userJoinDate
        } : null,
        error: req.flash('errorMessage')
    });
};

module.exports = {
    login,
    renderLoginPage
};
