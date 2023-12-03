const express = require("express");
const morgan = require("morgan"); //Se utiliza para el registro (logging) de solicitudes HTTP
//const exceljs = require("exceljs");
//const multer = require("multer"); //Se utiliza para manejar la carga de archivos en formularios HTML

const app = express();
const api = require("./routes/index");

//Settings
app.set("port", process.env.PORT || 3001);
app.set("json spaces", 2);

//Middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//routes
app.use("/", api);
app.use("/login", (req, res) => {
  res.render("");
});

module.exports = app;
