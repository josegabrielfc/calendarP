const { Router } = require("express");
const router = Router();
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");
const userCtrl = require("../controller/user");
const holidays = require("./holidays");
const { insertData, pool } = require("../db");
const xlsx = require("xlsx");
const fileUpload = require("express-fileupload");
const bcryptjs = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");
const dotenv = require("dotenv");
const methods = require("../controller/authentication.controller");

dotenv.config();
router.use(fileUpload());

router.get("/itadori", (req, res) => {
  res.json({ Title: "Hello World itadori!" });
});

router.get("/sukuna", (req, res) => {
  res.json({ Title: "Hello World Sukuna!" });
});

module.exports = router;
