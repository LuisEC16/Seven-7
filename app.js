const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('express-flash');
const bodyParser = require('body-parser');
const path = require('path');
const loginController = require('./controllers/logincontroller');
const logoutController = require('./controllers/logoutcontroller');
const { isAuthenticated, isAdminAuthenticated } = require('./middlewares');
const { dbConfig } = require('./config/database');


const app = express();
const port = 3000;

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para parsear los cuerpos de las solicitudes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configurar carpeta 'uploads' como estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar carpeta 'js' como estática
app.use('/js', express.static(path.join(__dirname, 'js')));

// Configuración de la sesión
const sessionStore = new MySQLStore(dbConfig);

app.use(session({
    secret: 'secreto',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 3600000 }
}));

// Forzar eliminación de todas las sesiones al iniciar el servidor
sessionStore.clear((err) => {
    if (err) {
        console.error('Error al limpiar sesiones al iniciar el servidor:', err);
    } else {
        console.log('Sesiones limpiadas al iniciar el servidor');
    }
});

// Middleware para mensajes flash
app.use(flash());

// Middleware para establecer userLoggedIn en res.locals
app.use((req, res, next) => {
    res.locals.userLoggedIn = req.session.userLoggedIn || false;
    res.locals.userName = req.session.userName || null;
    res.locals.successMessage = req.flash('successMessage');
    res.locals.errorMessage = req.flash('errorMessage');
    next();
});

// Importar y configurar las rutas
const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const adminRouter = require('./routes/admin');
const catalogRouter = require('./routes/catalog');
const cartRouter = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const logoutRouter = require('./routes/logout');
const profileRouter = require('./routes/profile');
const passwordRouter = require('./routes/password');
const backupRouter = require('./routes/backup');


app.get('/login', loginController.renderLoginPage);
app.post('/login', loginController.login);

// Usar las rutas en la aplicación
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/admin', adminRouter);
app.use('/catalog', catalogRouter);
app.use('/cart', cartRouter);
app.use('/checkout', checkoutRoutes);
app.use('/logout', logoutRouter); 
app.use('/profile', profileRouter);
app.use('/password', passwordRouter);
app.use('/admin', backupRouter);


// Ruta para la página de éxito de pago
app.get('/payment-success', (req, res) => {
    res.render('payment-success');
});

// Ruta para verificar si el usuario está autenticado
app.get('/auth/check', (req, res) => {
    if (req.session.userLoggedIn) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
