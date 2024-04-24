const { Router } = require("express");
const router = Router();
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const app = require("./../app")

dotenv.config();
router.use(fileUpload());

router.get("/", (req, res) => {
    res.json({ Title: "Hello World Gojo!" });
  });

router.get("/itadori", (req, res) => {
  res.json({ Title: "Hello World itadori!" });
});

router.get("/sukuna", (req, res) => {
  res.json({ Title: "Hello World Sukuna!" });
});


app.use("/api/test/", router);
