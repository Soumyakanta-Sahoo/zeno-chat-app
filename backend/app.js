const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(connectionRoutes);
app.use(userRoutes);
app.use(messageRoutes);
app.use(authRoutes);

// Health route
app.get("/", (req, res) => {
  res.send("Zeno backend is running");
});

module.exports = app;