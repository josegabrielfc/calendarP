const { Router } = require("express");
const router = Router();
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

dotenv.config();
router.use(fileUpload());

router.get("/itadori", (req, res) => {
  res.json({ Title: "Hello World itadori!" });
});

router.get("/sukuna", (req, res) => {
  res.json({ Title: "Hello World Sukuna!" });
});

module.exports = router;
