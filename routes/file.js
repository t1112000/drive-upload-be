const express = require("express");
const multer = require("multer");
const { getFiles, createFile, deleteFile } = require("../controllers/file");

const router = express.Router();
var upload = multer({ dest: "./upload/" });

router.get("/", getFiles);
router.post("/", upload.array("file"), createFile);
router.delete("/:id", deleteFile);

module.exports = router;
