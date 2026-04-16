const Connection = require("../models/Connection");
const User = require("../models/User");

// 🔹 Send connection request
const addConnection = async (req, res) => {
  try {
    const { senderId, receiverId, note } = req.body;

    // ❌ Self request
    if (senderId === receiverId) {
      return res.status(400).json({ error: "Cannot connect with yourself" });
    }

    // 🔍 Check users exist
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    // ❌ Prevent duplicate / reverse duplicate
    const existingConnection = await Connection.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (existingConnection) {
      return res.status(400).json({
        error: "Connection already exists or pending",
      });
    }

    // ✅ Create request
    const connection = await Connection.create({
      senderId,
      receiverId,
      note: note || "",
    });

    // 🔥 Emit real-time event to receiver
    const io = req.app.get("io");
    const users = req.app.get("users");

    const receiverSockets = users?.[receiverId];

    if (receiverSockets) {
    receiverSockets.forEach((id) => {
        io.to(id).emit("new_connection_request", connection);
    });
    }

    res.status(201).json(connection);
  } catch (err) {
    console.error("Connection error:", err);
    res.status(500).json({ error: "Failed to send request" });
  }
};


const updateConnectionStatus = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status } = req.body;

    // ✅ Validate status
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // 🔍 Find connection
    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    // ❌ Only pending can be updated
    if (connection.status !== "pending") {
      return res.status(400).json({ error: "Already processed" });
    }

    // ✅ Update status
    connection.status = status;
    await connection.save();

    // 🔥 Emit real-time event
    const io = req.app.get("io");
    const users = req.app.get("users");

    const senderSockets = users?.[connection.senderId];
    const receiverSockets = users?.[connection.receiverId];

    const payload = {
        connection,
        status,
    };

    // Emit to sender
    if (senderSockets) {
      senderSockets.forEach((id) => {
        io.to(id).emit("connection_status_updated", payload);
      });
    }

    // Emit to receiver
    if (receiverSockets) {
      receiverSockets.forEach((id) => {
        io.to(id).emit("connection_status_updated", payload);
      });
    }

    console.log("=== CONNECTION UPDATE DEBUG ===");
    console.log("Sender:", connection.senderId);
    console.log("Receiver:", connection.receiverId);
    console.log("Users map:", users);
    console.log("Sender sockets:", users?.[connection.senderId]);
    console.log("Receiver sockets:", users?.[connection.receiverId]);

    res.json({ success: true, connection });
  } catch (err) {
    console.error("Update connection error:", err);
    res.status(500).json({ error: "Failed to update connection" });
  }
};


// 🔹 Get pending requests for a user
const getPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const requests = await Connection.find({
      receiverId: userId,
      status: "pending",
    });

    res.json(requests);
  } catch (err) {
    console.error("Fetch pending error:", err);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
};

// 🔹 Get accepted connections for a user
const getAcceptedConnections = async (req, res) => {
  try {
    const { userId } = req.params;

    const connections = await Connection.find({
      status: "accepted",
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    res.json(connections);
  } catch (err) {
    console.error("Fetch connections error:", err);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
};


module.exports = { 
    addConnection, 
    updateConnectionStatus, 
    getPendingRequests, 
    getAcceptedConnections,
};