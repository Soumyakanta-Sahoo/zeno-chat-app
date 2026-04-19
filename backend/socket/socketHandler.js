const Message = require("../models/Message");

const users = {};

const setupSocket = (io) => {
  io.on("connection", (socket) => {

    // Persistent user ID
    const userId = String(socket.handshake.auth.userId || socket.id);
    socket.userId = userId;


    // prevent duplicate users
    if (!users[userId]) {
      users[userId] = [];
    }

    users[userId].push(socket.id);

    console.log("User connected:", userId);
    console.log("Current users map:", users);

    // Broadcast online users
    io.emit("online_users", Object.keys(users));

    // SEND MESSAGE
    socket.on("send_message", async (data) => {
        if (!data.to || data.to === socket.userId) {
            console.log("Invalid recipient:", data.to);
            return;
        }

        const receiverSockets = users[String(data.to)];

        const messageData = {
            text: data.text,
            senderId: userId,
            receiverId: data.to,
            timestamp: new Date(),
            seen: false,
            delivered: !!receiverSockets,
        };

        try {
            await Message.create(messageData);
        } catch (err) {
            console.error("DB Save Error:", err);
        }

        // Send to receiver
        if (receiverSockets) {
            receiverSockets.forEach((id) => {
                io.to(id).emit("receive_message", messageData);
            });
        }

        // Notify sender delivery status
        const senderSockets = users[String(userId)];

        if (senderSockets && receiverSockets) {
            senderSockets.forEach((id) => {
                io.to(id).emit("message_delivered", {
                    receiverId: data.to,
                    timestamp: messageData.timestamp,
                });
            });
        }
    });

    // MESSAGE SEEN
    socket.on("mark_as_seen", async (data) => {
        const { senderId, receiverId } = data;

        try {
            await Message.updateMany(
                { 
                    senderId: senderId,
                    receiverId: receiverId,
                    seen: { $ne: true },
                },
                { $set: { seen: true } }
            );

            const senderSockets = users[String(senderId)];

            if (senderSockets) {
                senderSockets.forEach((id) => {
                    io.to(id).emit("messages_seen_update", {
                        seenBy: receiverId,
                    });
                });
            }
        } catch (err) {
            console.error("Seen update error:", err);
        }
    });    

    // TYPING
    socket.on("typing", (data) => {
        if (!data.to || data.to === userId) return;

        const receiverSockets = users[String(data.to)];

        if (receiverSockets) {
            receiverSockets.forEach((id) => {
                io.to(id).emit("typing", { 
                    senderId: userId,
                 });
            });
        }
    });

    // DISCONNECT
    socket.on("disconnect", () => {

        if (users[socket.userId]) {
            users[socket.userId] = users[socket.userId].filter(
                (id) => id !== socket.id
            );

            if (!users[socket.userId] || users[socket.userId].length === 0) {
                delete users[socket.userId];
            }
        }
        console.log("User disconnected:", socket.userId);

        io.emit("online_users", Object.keys(users));
    });
  });
};

module.exports = { setupSocket, users };
