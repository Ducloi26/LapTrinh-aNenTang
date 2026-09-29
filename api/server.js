const path = require("node:path");
const express = require("express");
const cors = require("cors");

require("dotenv").config({
  path: path.join(path.dirname(process.argv[1]), ".env"),
});

const authRoutes = require("./authRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API đang chạy",
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
