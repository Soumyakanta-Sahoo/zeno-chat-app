import { useEffect } from "react";
import { io } from "socket.io-client";

export default function useSocketChat({
  BASE_URL,
  currentUser,

  socketRef,
  socketIdRef,
  selectedUserRef,
  typingTimeoutRef,

  setSocketId,
  setUsers,
  setMessages,
  setUnread,
  setTypingUser,

  setPendingRequests,
  setConnections,
  setSelectedUser,
  setUserMap,
}) {
  useEffect(() => {
    if (!currentUser?._id) return;

    const userId = currentUser._id;

    socketRef.current = io(BASE_URL, {
      auth: { userId },
    });

    setSocketId(userId);
    socketIdRef.current = userId;

    // Basic events
    socketRef.current.on("connect", () => {
      console.log("Connected as:", userId);
    });

    socketRef.current.on("disconnect", () => {
      console.warn("Socket disconnected");
    });

    socketRef.current.on("connect_error", (err) => {
      console.warn("Socket error:", err.message);
    });

    socketRef.current.on("reconnect_attempt", () => {
      console.log("Trying reconnect...");
    });

    socketRef.current.on("reconnect", () => {
      console.log("Reconnected");
    });

    // Receive message
    socketRef.current.on("receive_message", (data) => {
      if (data.senderId === socketIdRef.current) return;

      const sender = data.senderId;

      setMessages((prev) => ({
        ...prev,
        [sender]: [...(prev[sender] || []), data],
      }));

      if (selectedUserRef.current !== sender) {
        setUnread((prev) => ({
          ...prev,
          [sender]: prev[sender] ? prev[sender] + 1 : 1,
        }));
      }
    });

    // Seen updates
    socketRef.current.on("messages_seen_update", ({ seenBy }) => {
      setMessages((prev) => {
        const updated = { ...prev };

        if (updated[seenBy]) {
          updated[seenBy] = updated[seenBy].map((msg) => ({
            ...msg,
            seen: true,
          }));
        }

        return updated;
      });
    });

    // Online users
    socketRef.current.on("online_users", (userList) => {
      setUsers(userList);
    });

    // Typing
    socketRef.current.on("typing", (data) => {
      if (
        !selectedUserRef.current ||
        data.senderId !== selectedUserRef.current
      )
        return;

      setTypingUser(data.senderId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(null);
      }, 2000);
    });

    // New request
    socketRef.current.on(
      "new_connection_request",
      async (data) => {
        setPendingRequests((prev) => [
          ...prev,
          data,
        ]);

        try {
          const res = await fetch(
            `${BASE_URL}/users/search?id=${data.senderId}`
          );

          if (!res.ok) return;

          const user = await res.json();

          setUserMap((prev) => ({
            ...prev,
            [user._id]: user.name,
          }));
        } catch {}
      }
    );

    // Request accepted/rejected
    socketRef.current.on(
      "connection_status_updated",
      async ({ connection, status }) => {
        setPendingRequests((prev) =>
          prev.filter(
            (req) => req._id !== connection._id
          )
        );

        if (status === "accepted") {
          const otherUser =
            connection.senderId === userId
              ? connection.receiverId
              : connection.senderId;

          setConnections((prev) => {
            if (prev.includes(otherUser))
              return prev;

            return [otherUser, ...prev];
          });

          try {
            const res = await fetch(
              `${BASE_URL}/users/search?id=${otherUser}`
            );

            if (res.ok) {
              const user = await res.json();

              setUserMap((prev) => ({
                ...prev,
                [user._id]: user.name,
              }));
            }
          } catch {}

          setSelectedUser(
            (prev) => prev || otherUser
          );
        }
      }
    );

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser]);
}