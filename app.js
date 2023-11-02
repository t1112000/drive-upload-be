const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const logger = require("morgan");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const fileRouter = require("./routes/file");
const fileTypeRouter = require("./routes/file-type");
const reportRouter = require("./routes/report");

const app = express();

const server = http.createServer(app);
const io = new Server(server);

global.io = io;

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

global.io.on("connection", (socket) => {
  console.log(`${socket.id} user connection`);

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});

module.exports = { io };
