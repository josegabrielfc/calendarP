const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST || "bzqezdgk8fzrw1iol2zw-mysql.services.clever-cloud.com",
    user: process.env.DB_USER || "uiruubm1ipc5pwsg",
    password: process.env.DB_PASSWORD || "P7wxc3XwtStScSYfeYXY", //password
    database: process.env.DB_DATABASE || "bzqezdgk8fzrw1iol2zw", //database
    port: process.env.DB_PORT || "3306",
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
  },
  SECRET_TOKEN: "pilar1234",
};

module.exports = config;