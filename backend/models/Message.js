const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  receiverId: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },

  seen: {
    type: Boolean,
    default: false,
  },
});

messageSchema.index({ senderId: 1, receiverId: 1, timestamp: 1 });

module.exports = mongoose.model("Message", messageSchema);