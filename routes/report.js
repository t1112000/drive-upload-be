const express = require("express");

const { getReports } = require("../controllers/report");

const router = express.Router();

router.get("/", getReports);

module.exports = router;
