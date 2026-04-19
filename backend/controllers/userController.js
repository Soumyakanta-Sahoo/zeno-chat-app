const User = require("../models/User");

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("_id name email");
    res.json(users);
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Search user
const findUserByEmail = async (req, res) => {
  try {
    const { email, id } = req.query;

    let user;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();

      user = await User.findOne(
        { email: cleanEmail },
        "_id name email"
      );
    } else if (id) {
      user = await User.findById(
        id,
        "_id name email"
      );
    } else {
      return res.status(400).json({
        error: "Email or User ID is required",
      });
    }

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(user);
  } catch (err) {
    console.error("Find user error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getUsers,
  findUserByEmail,
};