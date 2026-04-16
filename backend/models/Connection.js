const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    receiverId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// 🔥 Prevent duplicate requests between same users
connectionSchema.index(
  { senderId: 1, receiverId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Connection", connectionSchema);