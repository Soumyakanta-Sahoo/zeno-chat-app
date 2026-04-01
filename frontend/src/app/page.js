"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState({});
  const [socketId, setSocketId] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMap, setUserMap] = useState({});
  const [typingUser, setTypingUser] = useState(null);
  const [unread, setUnread] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const socketRef = useRef(null);
  const socketIdRef = useRef("");
  const messageEndRef = useRef(null);
  const selectedUserRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      router.push("/auth") ;
    }
  }, []);

  useEffect(() => {
    const checkscreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkscreen();

    window.addEventListener("resize", checkscreen);

    return () => window.removeEventListener("resize", checkscreen);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("https://zeno-chat-app.onrender.com/users");
      const data = await res.json();

      const map = {};
      data.forEach((u) => {
        map[u._id] = u.name;
      });

      setUserMap(map);
    };

    fetchUsers();
  }, []);

  useEffect(() => {

    // Step 1: Get logged in user ID
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return

    const userId = user._id;

    // Step 2: Connect socket with REAL user ID (not socket.id)
    socketRef.current = io("https://zeno-chat-app.onrender.com", {
      auth: { userId},
    });

    // Step 3: Set Identity
    setSocketId(userId);
    socketIdRef.current = userId;

    // Optional log
    socketRef.current.on("connect", () => {
      console.log("Connected as:", userId);
    });

    // Receive messages
    socketRef.current.on("receive_message", (data) => {
      if (data.senderId === socketIdRef.current ) return;

      const sender = data.senderId;

      // Add Message
      setMessages((prev) => ({
        ...prev,
        [sender]: [...(prev[sender] || []), data],
      }));

      // add unread count (if not active chat)
      if (selectedUserRef.current !== sender) {
        setUnread((prev) => ({
          ...prev,
          [sender]: prev[sender] ? prev[sender] + 1 : 1,
        }));
      }
    });

    // Receive "Seen" updates
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

    socketRef.current.on("online_users", (userList) => {
      setUsers(userList);


      const otherUsers = socketId
        ? userList.filter((user) => user !== socketId)
        : [];

      if (socketId) {
        setSelectedUser((prev) => {
          if (prev) return prev;
          return otherUsers.length > 0 ? otherUsers[0] : null;
        });
      }
    });

    socketRef.current.on("typing", (data) => {
      if (!selectedUserRef.current || data.senderId !== selectedUserRef.current) return;

      setTypingUser(data.senderId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(null);
      }, 2000);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto scroll
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Fetch messages
  useEffect(() => {
    if (!selectedUser || !socketId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `https://zeno-chat-app.onrender.com/messages/${socketId}/${selectedUser}`
        );

        const data = await res.json();

        setMessages((prev) => ({
          ...prev,
          [selectedUser]: data,
        }));
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };

    fetchMessages();
  }, [selectedUser, socketId]);

  // Trigger "Seen" event when opening a chat or receiving a message
  const currentChatLength = messages[selectedUser]?.length || 0;

  useEffect(() => {
    if (selectedUser && socketRef.current) {
      // 1. Tell the server I have seen these messages
      socketRef.current.emit("mark_as_seen", {
        senderId: selectedUser,
        receiverId: socketId,
      });

      // 2. Clear unread count locally for this user
      setUnread((prev) => ({
        ...prev,
        [selectedUser]: 0,
      }));
    }
  }, [selectedUser, currentChatLength, socketId]); // <--- All dependencies listed clearly

  const sendMessage = () => {
    if (message.trim() === "") return;
    if (!selectedUser || selectedUser === socketId) return;

    const newMessage = {
      text: message,
      senderId: socketId,
      receiverId: selectedUser,
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI
    setMessages((prev) => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), newMessage],
    }));

    socketRef.current.emit("send_message", {
      text: message,
      to: selectedUser,
    });

    setMessage("");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">

      {/* SIDEBAR */}
      {showSidebar && (
        <div className="w-full md:w-1/4 bg-slate-900 text-gray-300 p-4 border-r border-slate-700 shadow-xl">
          <h2 className="font-bold mb-4">Users</h2>

          {[...Object.keys(userMap)]
            .filter((user) => user !== socketId)
            .sort((a, b) => {
              const lastA = messages[a]?.[messages[a].length - 1]?.timestamp || 0;
              const lastB = messages[b]?.[messages[b].length - 1]?.timestamp || 0;

              return new Date(lastB) - new Date(lastA);
            })
            .map((user) => {
              const lastMsg = messages[user]?.[messages[user].length - 1];
            
              return (
                <div
                  key={user}
                  onClick={() => {
                    if (user === socketId) return;

                    setSelectedUser(user);
                    setMessage("");

                    // Clear unread count
                    setUnread((prev) => ({
                      ...prev,
                      [user]: 0,
                    }));
                    
                    if (window.innerWidth < 768) {
                      setShowSidebar(false);
                    }
                  }}
                  className={`p-4 rounded-xl cursor-pointer mb-3 transition-all duration-200 border ${
                    selectedUser === user
                      ? "bg-blue-600 border-blue-400 shadow-lg translate-x-1" // Selected: Bright & shifted
                      : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/70 hover:border-slate-600" // Not Selected: Subtle box
                  }`}
                >
                  <div className="flex justify-between items-center">

                    {/* LEFT: Name + Message */}
                    <div className="flex flex-col">
                      {/* Name */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center rounded-full text-sm">
                            {userMap[user]?.[0] || "?"}
                          </div>

                          {/* 🟢 Online */}
                          {users.includes(user) && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></span>
                          )}
                        </div>

                        <span className="font-medium">
                          {userMap[user] ?? "Loading..."}
                        </span>
                      </div>
                      
                      {/* Last message OR Typing*/}
                      <span className="text-xs text-gray-500 truncate max-w-35">
                        {typingUser === user
                          ? "Typing..."
                          : lastMsg
                          ? lastMsg.text
                          : "No messages yet"}
                      </span>
                    </div>

                    {/* RIGHT: Timestamp */}
                    {lastMsg && (
                      <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        {new Date(lastMsg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}

                    {/* Unread Badge */}
                    {unread[user] > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-5 text-center ml-2">
                        {unread[user]}
                      </span>
                    )}
                  </div>
                </div>
              )})}
        </div>
      )}

      {/* CHAT AREA */}
      {(!showSidebar || !isMobile) && (
        <div className="w-full md:w-3/4 flex flex-col bg-slate-950 relative overflow-hidden">

          {/* HEADER */}
          <div className="absolute top-4 left-4 right-4 p-4 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl flex items-center gap-3 shadow-lg z-20">
          {/* Back Button (Mobile only) */}
          <button
            onClick={() => setShowSidebar(true)}
            className="md:hidden text-white text-lg mr-2"
          >
            ←
          </button>

            <div className="relative">

              {/* Avatar circle */}
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center rounded-full font-bold shadow-inner ring-2 ring-slate-800">
                {userMap[selectedUser]?.[0] || "?"}
              </div>

              {users.includes(selectedUser) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>

            {/* Name + typing */}
            <div>
              <h2 className="font-semibold">
                {userMap[selectedUser] || "Select a user"}
              </h2>

              {typingUser === selectedUser && (
                <p className="text-xs text-gray-500">Typing...</p>
              )}
            </div>

          </div>

          {!selectedUser && (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a user to start chatting
            </div>
          )}

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-32 pb-4 space-y-4 bg-linear-to-b from-slate-950 via-gray-900 to-slate-800">
            {(messages[selectedUser] || []).map((msg, index) => {
              const isMe = msg.senderId === socketId;

              return (
                <div 
                  key={index}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[70%] text-[15px] shadow-sm transition-all hover:shadow-md ${
                      isMe
                        ? "bg-blue-600 text-white rounded-tr-none self-end"
                        : "bg-slate-100 text-slate-800 rounded-tl-none self-start border border-slate-700/50"
                    }`}
                  >
                    <div className="leading-relaxed">{msg.text}</div>

                    <div className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}

                      {isMe && (
                        <span
                          className={`text-[10px] ml-1 ${
                            msg.seen
                              ? "text-white-500"
                              : msg.delivered
                              ? "text-gray-500"
                              : "text-gray-300"
                          }`}
                        >
                          {msg.seen ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Scroll anchor */}
            <div ref={messageEndRef} />
          </div>

          {/* Typing indicator */}
          {typingUser === selectedUser && (
            <div className="text-sm text-gray-500 px-4 pb-2">
              {userMap[selectedUser] ? userMap[selectedUser] : "User"} is typing...
            </div>
          )}

          {/* INPUT AREA */}
          <div className="p-4 bg-transparent">
            <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
              <input
                type="text"
                className="flex-1 bg-transparent text-white border-none px-4 py-2 outline-none placeholder-slate-500"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (selectedUser) {
                    socketRef.current.emit("typing", { to: selectedUser });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />

              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-lg"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-5 h-5"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}