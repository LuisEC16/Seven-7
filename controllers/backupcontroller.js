const path = require('path');
const fs = require('fs');
const mysqldump = require('mysqldump');
const mysql = require('mysql2/promise');
const cron = require('node-cron');

const createBackup = async (req, res) => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', '_').slice(0, -5);
    const backupFile = path.join(__dirname, '../backups', `backup_${timestamp}.sql`);

    try {
        await mysqldump({
            connection: {
                host: 'localhost',
                user: 'root',
                password: '', // tu contraseña
                database: 'seeven7'
            },
            dumpToFile: backupFile,
        });

        if (req && res) {
            req.flash('success', 'Respaldo completado exitosamente');
            res.redirect('/admin/backups');
        } else {
            console.log('Respaldo completado exitosamente');
        }
    } catch (error) {
        console.error('Error al crear el respaldo:', error);
        if (req && res) {
            req.flash('error', 'Error al crear el respaldo');
            res.redirect('/admin/backups');
        }
    }
};

// Programar la copia de seguridad cada 24 horas
cron.schedule('0 0 * * *', () => {
    console.log('Iniciando respaldo automático...');
    createBackup();
});

const getBackupPage = (req, res) => {
    const backupDir = path.join(__dirname, '../backups');

    fs.readdir(backupDir, (err, files) => {
        if (err) {
            console.error('Error al leer el directorio de respaldos:', err);
            req.flash('error', 'Error al leer los respaldos');
            return res.redirect('/admin/dashboard');
        }

        res.render('admin/backups', { files, messages: req.flash() });
    });
};

const restoreBackup = async (req, res) => {
    const backupFile = req.body.file;
    const backupFilePath = path.join(__dirname, '../backups', backupFile);

    if (!fs.existsSync(backupFilePath)) {
        req.flash('error', 'El archivo de respaldo no existe');
        return res.redirect('/admin/backups');
    }

    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // tu contraseña
            database: 'seeven7',
            multipleStatements: true
        });

        // Deshabilitar verificaciones de claves foráneas
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Eliminar filas de tablas con claves foráneas
        await connection.query('DELETE FROM carrito_productos');
        await connection.query('DELETE FROM carrito_de_compras');
        await connection.query('DELETE FROM administrador');
        await connection.query('DELETE FROM comprobante');
        await connection.query('DELETE FROM historial_de_compras');
        await connection.query('DELETE FROM producto_imagenes');
        await connection.query('DELETE FROM producto_tallas');
        await connection.query('DELETE FROM productos');
        await connection.query('DELETE FROM sessions');
        await connection.query('DELETE FROM tallas');
        await connection.query('DELETE FROM usuarios');

        // Truncar tablas relevantes antes de la restauración
        const tables = [
            'carrito_productos',
            'carrito_de_compras',
            'administrador',
            'comprobante',
            'historial_de_compras',
            'producto_imagenes',
            'producto_tallas',
            'productos',
            'sessions',
            'tallas',
            'usuarios'
        ];

        for (const table of tables) {
            await connection.query(`TRUNCATE TABLE ${table}`);
        }

        // Habilitar verificaciones de claves foráneas
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        const sql = fs.readFileSync(backupFilePath, 'utf8');
        await connection.query(sql);

        req.flash('success', 'Respaldo restaurado exitosamente');
        res.redirect('/admin/backups');
    } catch (error) {
        console.error('Error al restaurar el respaldo:', error);
        req.flash('error', 'Error al restaurar el respaldo');
        res.redirect('/admin/backups');
    }
};

const deleteBackup = (req, res) => {
    const backupFile = req.body.file;
    const backupFilePath = path.join(__dirname, '../backups', backupFile);

    if (!fs.existsSync(backupFilePath)) {
        req.flash('error', 'El archivo de respaldo no existe');
        return res.redirect('/admin/backups');
    }

    try {
        fs.unlinkSync(backupFilePath);
        req.flash('success', 'Respaldo eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar el respaldo:', error);
        req.flash('error', 'Error al eliminar el respaldo');
    }

    res.redirect('/admin/backups');
};

module.exports = {
    createBackup,
    getBackupPage,
    restoreBackup,
    deleteBackup
};
