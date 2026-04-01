const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "_id name");
    res.json(users);
  } catch (err) {
    console.error("Users fetch error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;