const express = require("express");
const multer = require("multer");
const {
  getFiles,
  createFile,
  deleteFile,
} = require("../controllers/file-part");

const router = express.Router();
var upload = multer({ dest: "./upload/" });

router.get("/", getFiles);
router.post("/", upload.single("file"), createFile);
router.delete("/:id", deleteFile);

module.exports = router;
