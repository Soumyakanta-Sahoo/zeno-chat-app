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

let users = {};

const { connectDB } = require("./config/db");

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

// Test route
app.get("/", (req, res) => {
  res.send("Zeno backend is running");
});


// User routes
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "_id name");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
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

// ✅ Get messages between two users
app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

  // Basic validation
  if (!user1 || !user2) {
    return res.status(400).json({ error: "Invalid users" });
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Socket connection
io.on("connection", (socket) => {

  // GET persistent user ID from client (if any)
  const userId = String(socket.handshake.auth.userId || socket.id);

  socket.userId = userId; // Override socket.userId with persistent userId


  // Prevent duplicate users
  if (!users[userId]) {
    users[userId] = []; // Map userId to socket.id
  }

  users[userId].push(socket.id);

  console.log("User connected:", userId);

  // Broadcast updated user list
  io.emit("online_users", Object.keys(users));

  // Handle message sending
  socket.on("send_message", async (data) => {
    if (!data.to || data.to === socket.userId) {
      console.log("Invalid receiver (self or empty):", data.to); // Ignore messages sent to self or with empty receiver
      return;
    }

    const messageData = {
      text: data.text,
      senderId: userId,
      receiverId: data.to,
      timestamp: new Date().toISOString(),
      seen: false,
    };

    console.log("Message received:", messageData);

    // Save message to MongoDB
    try {
      await Message.create(messageData);
    } catch (err) {
      console.error("DB Save Error:", err);
    }

    // Debug
    console.log("Users map:", users);
    console.log("Sending message to:", String(data.to));

    // Send ONLY to selected user
    const receiverSockets = users[String(data.to)];

    console.log("Receiver sockets:", receiverSockets);

    if (receiverSockets) {
        receiverSockets.forEach((id) => {
            io.to(id).emit("receive_message", messageData);
        });
    }
  });

  // Handle Read Receipts
  socket.on("mark_as_seen", async (data) => {
    const { senderId, receiverId } = data;

    try {
      // Update all unread messages from this sender to this receiver
      await Message.updateMany(
        { senderId: senderId, receiverId: receiverId, seen: { $ne: true } },
        { $set: { seen: true } }
      );

      // Notify the original sender that their messages were seen
      const senderSocketId = users[String(senderId)];
      if (senderSocketId) {
        senderSocketId.forEach((id) => {
            io.to(id).emit("messages_seen_update", { seenBy: receiverId });
        });
      }
    } catch (err) {
      console.error("Error updating seen status:", err);
    }
  });

  // Handle typing event
  socket.on("typing", (data) => {
    if (!data.to || data.to === userId) return;
    
    const receiverSocketId = users[String(data.to)];

    if (receiverSocketId) {
        receiverSocketId.forEach((id) => {
            io.to(id).emit("typing", {
                senderId: userId,
            });
        });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (users[socket.userId]) {
        users[socket.userId] = users[socket.userId].filter(
            (id) => id !== socket.id
        );

        if (users[socket.userId].length === 0) {
            delete users[socket.userId];
        }
    }

    console.log("User disconnected:", socket.userId);

    // Broadcast updated user list
    io.emit("online_users", Object.keys(users));
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});