'use strict'
const config = require('./src/config')
const mysql = require("mysql2/promise");
const app = require('./src/app')
// Database
const { createDatabase, createTables} = require("./src/db");

const dbConfig = config.db;

async function initializeDatabase() {
  try {
    const pool = mysql.createPool(dbConfig);
    // Crea la base de datos y las tablas
    await createDatabase();
    await createTables(pool);
    console.log('Conexión a la base de datos establecida...');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}
initializeDatabase();

//Starting the server
app.listen(config.port, () => {
  console.log(`API REST running on http://localhost:${config.port}`);
});
