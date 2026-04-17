const mysql = require('mysql2/promise');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'local'}` });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
    dateStrings: true,
});

pool.getConnection()
    .then(conn => {
        console.log('MySQL connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('MySQL connection error:', err);
        process.exit(-1);
    });

module.exports = pool;