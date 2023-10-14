const express = require("express");

const { getFiles, createFile } = require("../controllers/file");

const router = express.Router();

router.get("/", getFiles);
router.post("/", createFile);

module.exports = router;
