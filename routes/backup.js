const express = require('express');
const router = express.Router();
const { createBackup, restoreBackup, getBackupPage, deleteBackup } = require('../controllers/backupcontroller');
const { isAdminAuthenticated } = require('../middlewares');

router.get('/backups', isAdminAuthenticated, getBackupPage);
router.post('/backup', isAdminAuthenticated, createBackup);
router.post('/restore', isAdminAuthenticated, restoreBackup);
router.post('/delete', isAdminAuthenticated, deleteBackup);

module.exports = router;
