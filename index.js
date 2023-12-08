"use strict";
const config = require("./src/config");
const app = require("./src/app");

// Database
const { startDatabase, executeScript } = require("./src/db");

async function initializeDatabase() {
  try {
    await startDatabase();
    await executeScript();
    console.log("Conexión a la base de datos establecida...");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
  }
}
initializeDatabase();

//Starting the server
app.listen(config.port, () => {
  console.log(`API REST running on http://localhost:${config.port}`);
});
