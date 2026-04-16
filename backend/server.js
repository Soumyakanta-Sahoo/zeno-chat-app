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


// User routes
app.use(userRoutes);

// ✅ Get messages between two users
app.use(messageRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Zeno backend is running");
});



// Auth routes 

// Signup
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
        });
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Signup failed" });
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid password" });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
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