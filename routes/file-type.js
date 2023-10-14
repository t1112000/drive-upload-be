const express = require("express");
const { getFileTypes } = require("../controllers/file");

const router = express.Router();

router.get("/", getFileTypes);

module.exports = router;
