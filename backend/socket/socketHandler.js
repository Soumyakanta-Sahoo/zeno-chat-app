const Message = require("../models/Message");

let users = {};

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

    // Broadcast online users
    io.emit("onlineUsers", Object.keys(users));

    // SEND MESSAGE
    socket.on("sendMessage", async (data) => {
        if (!data.to || data.to === socket.userId) {
            console.log("Invalid recipient:", data.to);
            return;
        }

        const messageData = {
            text: data.text,
            senderId: userId,
            receiverId: data.to,
            timestamp: new Date().toISOString(),
            seen: false,
        };

        console.log("Message received:", messageData);

        try {
            await Message.create(messageData);
        } catch (err) {
            console.error("DB Save Error:", err);
        }

        console.log("Users map:", users);
        console.log("Sending to:", String(data.to));

        const receiverSockets = users[String(data.to)];

        console.log("Receiver sockets:", receiverSockets);

        if (receiverSockets) {
            receiverSockets.forEach((id) => {
                io.to(id).emit("receiveMessage", messageData);
            });
        }
    });

    // MESSAGE SEEN
    socket.on("mark_seen", async (data) => {
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

            if (!users[userId] || users[userId].length === 0) {
                delete users[userId];
            }
        }
        console.log("User disconnected:", socket.userId);

        io.emit("onlineUsers", Object.keys(users));
    });
  });
};

module.exports = { setupSocket };
