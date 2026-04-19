// Import packages

const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const { Server } = require("socket.io");
require("dotenv").config();
const User = require("./models/User");
const bcrypt = require("bcryptjs");



const { connectDB } = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { setupSocket,users } = require("./socket/socketHandler");
const connectionRoutes = require("./routes/connectionRoutes");


const authRoutes = require("./routes/authRoutes");


// Initialize app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: [
        "http://localhost:3000",
        "https://zeno-chat-app.vercel.app",
    ],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(connectionRoutes);


app.use(authRoutes);

// User routes
app.use(userRoutes);

// ✅ Get messages between two users
app.use(messageRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Zeno backend is running");
});



// Socket connection
setupSocket(io);
app.set("io", io);
app.set("users", users);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});