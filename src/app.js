const express = require("express");
const morgan = require("morgan"); //Se utiliza para el registro (logging) de solicitudes HTTP
const cors = require('cors');

const app = express();
const api = require("./routes/index");
const test = require("./api/test");

//Settings
app.set("port", process.env.PORT || 3001);
app.set("json spaces", 2);

//Middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

//routes
app.use("/", api);

module.exports = app;
