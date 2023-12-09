"use strict";
const config = require("./src/config");
const app = require("./src/app");

// Database
const { initializeDatabase } = require("./src/db");

initializeDatabase();

//Starting the server
app.listen(config.port, () => {
  console.log(`API REST running on http://localhost:${config.port}`);
});
