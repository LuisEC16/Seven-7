const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            req.flash('errorMessage', 'Error al cerrar sesión');
            return res.redirect('/');
        }
        res.redirect('/login');
    });
};

const adminLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            req.flash('errorMessage', 'Error al cerrar sesión');
            return res.redirect('/admin/login'); 
        }
        res.redirect('/admin/login');
    });
};

module.exports = {
    logout,
    adminLogout
};
