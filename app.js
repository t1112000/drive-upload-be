const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const logger = require("morgan");
const cors = require("cors");

const fileRouter = require("./routes/file");
const fileTypeRouter = require("./routes/file-type");
const reportRouter = require("./routes/report");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger("dev"));
app.use(cors());

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected"))
  .catch(() => console.log("Error connecting to database"));

app.use("/api/files", fileRouter);
app.use("/api/file-types", fileTypeRouter);
app.use("/api/reports", reportRouter);

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
