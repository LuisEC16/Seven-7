const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admincontroller');
const inventoryController = require('../controllers/inventorycontroller');
const upload = require('../config/multer');
const catalogController = require('../controllers/catalogcontroller');
const cartController = require('../controllers/cartcontroller');
const paymentController = require('../controllers/paymentcontroller');
const reportController = require('../controllers/reportcontroller');
const { isAuthenticated, isAdminAuthenticated } = require('../middlewares');

console.log('admincontroller:', adminController);
console.log('inventorycontroller:', inventoryController);
console.log('catalogcontroller:', catalogController);
console.log('cartcontroller:', cartController);
console.log('isAuthenticated:', isAuthenticated);
console.log('isAdminAuthenticated:', isAdminAuthenticated);

router.get('/login', (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { message: null, error: null });
});

router.post('/login', adminController.login);

router.get('/dashboard', isAdminAuthenticated, adminController.dashboard);

router.get('/logout', isAdminAuthenticated, adminController.logout);

router.get('/payments', isAdminAuthenticated, paymentController.viewPayments);
router.post('/payments/update', isAdminAuthenticated, paymentController.updatePaymentStatus);

// Rutas para la generación de reportes
router.get('/reports', isAdminAuthenticated, reportController.renderReportsPage);
router.post('/reports/generate', isAdminAuthenticated, reportController.generateReport);

router.get('/manage-users', isAdminAuthenticated, adminController.manageUsers);
router.post('/edit-users', isAdminAuthenticated, adminController.editUsers);
router.post('/delete-users', isAdminAuthenticated, adminController.deleteUsers);
router.post('/update-user', isAdminAuthenticated, adminController.updateUser);

router.get('/catalog', isAuthenticated, catalogController.catalog);
router.post('/add-to-cart/:id', isAuthenticated, cartController.addToCart);
router.get('/cart', isAuthenticated, cartController.viewCart);

router.get('/manage-inventory', isAdminAuthenticated, inventoryController.manageInventory);
router.post('/add-product', isAdminAuthenticated, inventoryController.addProduct);
router.get('/edit-product/:id', isAdminAuthenticated, inventoryController.editProductPage);
router.post('/edit-product/:id', isAdminAuthenticated, upload.single('imagen'), inventoryController.updateProduct);
router.post('/delete-product/:id', isAdminAuthenticated, inventoryController.deleteProduct);

module.exports = router;
