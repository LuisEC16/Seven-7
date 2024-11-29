// database.js
const mysql = require('mysql');

// Configuración de la conexión a la base de datos MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'seeven7',
    port: 3306
};

// Crear la conexión a la base de datos
const db = mysql.createConnection(dbConfig);

// Conectar a la base de datos MySQL
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conectado a la base de datos MySQL');
});

module.exports = { db, dbConfig };
