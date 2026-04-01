const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// GET messages between two users
router.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

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

module.exports = router;