const isAuthenticated = (req, res, next) => {
    if (req.session.userLoggedIn) {
        return next();
    } else {
        res.redirect('/login');
    }
};

const isAdminAuthenticated = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        return next();
    } else {
        res.redirect('/admin/login');
    }
};

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('errorMessage', 'Por favor, inicia sesión para continuar');
    res.redirect('/login');
};


module.exports = { 
    isAuthenticated,
    isAdminAuthenticated,
    ensureAuthenticated
};
