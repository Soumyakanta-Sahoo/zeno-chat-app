const express = require("express");
const router = express.Router();

const {
  addConnection,
  updateConnectionStatus,
  getPendingRequests,
  getAcceptedConnections,
} = require("../controllers/connectionController");

// Send request
router.post("/connections", addConnection);

// Accept / Reject request
router.put("/connections/:connectionId", updateConnectionStatus);

// Get pending requests
router.get("/connections/pending/:userId", getPendingRequests);

// Get accepted connections
router.get("/connections/accepted/:userId", getAcceptedConnections);

module.exports = router;