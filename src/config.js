module.exports = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1Q2W3E4R",
    database: process.env.DB_NAME || "calendar",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  SECRET_TOKEN: "pilar1234",
};
