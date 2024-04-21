const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1Q2W3E4R", //password
    database: process.env.DB_DATABASE || "calendar", //database
    port: process.env.DB_PORT || "3306",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  SECRET_TOKEN: "pilar1234",
};

module.exports = config;