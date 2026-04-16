const express = require("express");
const router = express.Router();


const {
    getUsers,
    findUserByEmail,
} = require("../controllers/userController");

// GET only connected users
router.get("/users", getUsers);

// Find user by Email
router.get("/users/search", findUserByEmail);

module.exports = router;