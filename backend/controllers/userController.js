const User = require("../models/User");

// 🔹 Get all users (used for userMap / name mapping)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("_id name email");

    // Always return array
    res.json(users);
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// 🔹 Find user by email (for search feature)
const findUserByEmail = async (req, res) => {
  try {
    // ✅ Extract BOTH email and id from query parameters
    const { email, id } = req.query;

    let user;

    if (email) {
      user = await User.findOne({ email }, "_id name email");
    } else if (id) {
      // ✅ Now 'id' is defined and won't throw a ReferenceError
      user = await User.findById(id, "_id name email");
    } else {
      // ✅ Check if NEITHER was provided
      return res.status(400).json({ error: "Email or User ID is required" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Find user error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getUsers, findUserByEmail };