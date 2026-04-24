const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 100,
  timezone: '-03:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000,
});

module.exports = pool;
