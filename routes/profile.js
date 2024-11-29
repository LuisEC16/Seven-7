const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares');
const profileController = require('../controllers/profilecontroller');

router.get('/', isAuthenticated, profileController.renderProfilePage);
router.post('/update', isAuthenticated, profileController.updateProfile);
router.get('/confirm-email/:token', profileController.confirmEmailChange);
router.post('/delete-account', isAuthenticated, profileController.deleteAccount);


module.exports = router;
