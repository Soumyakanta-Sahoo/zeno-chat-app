"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";


// refactor

import MessageInput from "../components/chat/MessageInput";
import MessageList from "../components/chat/MessageList";
import ChatHeader from "../components/chat/ChatHeader";
import ProfileMenu from "../components/sidebar/ProfileMenu";
import SearchPopup from "../components/sidebar/SearchPopup";


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState({});
  const [socketId, setSocketId] = useState("");
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMap, setUserMap] = useState({});
  const [typingUser, setTypingUser] = useState(null);
  const [unread, setUnread] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [requestNote, setRequestNote] = useState("");
  const [searchError, setSearchError] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const router = useRouter();
  const socketRef = useRef(null);
  const socketIdRef = useRef("");
  const searchRef = useRef(null);
  const messageEndRef = useRef(null);
  const selectedUserRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingDebounceRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      router.replace("/auth") ;
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      setCurrentUser(user);
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

  // useef

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users`);

        if (!res.ok) {
          console.warn("Failed to fetch users");
          return;
        }
        
        const data = await res.json();

        // to be check by gpt
        if (!Array.isArray(data)) {
          console.error("Invalid users data:", data);
          return;
        }

        const map = {};
        data.forEach((u) => {
          map[u._id] = u.name;
        });

        setUserMap(map);
      } catch (err) {
        console.error("Fetch users error:", err);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!currentUser?._id) return;
    fetchConnections();
  }, [currentUser]);


  // Fetch pending requests
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        const res = await fetch(
          `${BASE_URL}/connections/pending/${user._id}`
        );

        if (!res.ok) {
          console.warn("Failed to fetch pending");
          return;
        }

        const data = await res.json();
        setPendingRequests(data);
      } catch (err) {
        console.error("Pending fetch error:", err);
      }
    };

    fetchPending();
  }, []);


  useEffect(() => {
    const handleClickOutside = () => {
      setShowProfileMenu(false);
    };

    if (showProfileMenu) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };

    if (showSearch) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [showSearch]);


  useEffect(() => {

    if (!currentUser?._id) return;

    // Step 1: Get logged in user ID

    const userId = currentUser._id;

    // Step 2: Connect socket with REAL user ID (not socket.id)
    socketRef.current = io(BASE_URL, {
      auth: { userId},
    });


    // Step 3: Set Identity
    setSocketId(userId);
    socketIdRef.current = userId;

    // Optional log
    socketRef.current.on("connect", () => {
      console.log("Connected as:", userId);
    });

    socketRef.current.on("disconnect", () => {
      console.warn("Socket disconnected");
    });

    socketRef.current.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    socketRef.current.on("reconnect_attempt", () => {
      console.log("Trying to reconnect...");
    });

    socketRef.current.on("reconnect", () => {
      console.log("Reconnected successfully");
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

      const currentUserId = socketIdRef.current;

      const otherUser = currentUserId
        ? userList.filter((user) => user !== currentUserId)
        : [];

      
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

    socketRef.current.on("new_connection_request", (data) => {
      setPendingRequests((prev) => [...prev, data]);
    });

    socketRef.current.on("connection_status_updated", ({ connection, status }) => {
      console.log("🔥 Connection updated via socket:", connection);

      const user = currentUser;
      if (!user) return;

      // Remove from pending
      setPendingRequests((prev) =>
        prev.filter((req) => req._id !== connection._id)
      );

      // if accepted -> add to connections
      if (status === "accepted"){
        const otherUser =
          connection.senderId === user._id
            ? connection.receiverId
            : connection.senderId;

        setConnections((prev) => {
          if (prev.includes(otherUser)) return prev;
          return [otherUser, ...prev];
        });

        // fetch user name if not present
        if (!userMap[otherUser]){
          fetch(`${BASE_URL}/users/search?id=${otherUser}`)
            .then((res) => res.json())
            .then((data) => {
              setUserMap((prev) => ({
                ...prev,
                [data._id]: data.name,
              }));
            })
            .catch(() => {});
        }

        setSelectedUser((prev) => prev || otherUser);
      }
    });

    // socketRef.current.on("connection_updated", ({ connection, status }) => {
    //   console.log("🔥 Connection updated:", connection);

    //   const user = currentUser;
    //   if (!user) return;

    //   // Remmove from pending
    //   setPendingRequests((prev) =>
    //     prev.filter((req) => req._id !== connection._id)
    //   );

    //   // if accepted -> add to connections
    //   if (status === "accepted"){
    //     const otherUser =
    //       connection.senderId === user._id
    //         ? connection.receiverId
    //         : connection.senderId;

    //     setConnections((prev) => {
    //       if (prev.includes(otherUser)) return prev;
    //       return [otherUser, ...prev];
    //     });

    //     // fetch user name if not present
    //     if (!userMap[otherUser]){
    //       fetch(`${BASE_URL}/users/search?id=${otherUser}`)
    //         .then((res) => res.json())
    //         .then((data) => {
    //           setUserMap((prev) => ({
    //             ...prev,
    //             [data._id]: data.name,
    //           }));
    //         })
    //         .catch(() => {});
    //     }

    //     // Auto-select if nothing selected
    //     setSelectedUser((prev) => prev || otherUser);
    //   }

    // });

    return () => {
      socketRef.current?.disconnect();
    };
   
  }, [currentUser]);

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
          `${BASE_URL}/messages/${socketId}/${selectedUser}`
        );

        if (!res.ok) {
          console.warn("Failed to fetch messages");
          return;
        }

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


  // Fetch connections
  const fetchConnections = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      const res = await fetch(
        `${BASE_URL}/connections/accepted/${user._id}`
      );

      if (!res.ok) {
        console.warn("Failed to fetch connections");
        return;
      }

      const data = await res.json();

      const mapped = data.map((conn) =>
        conn.senderId === user._id
          ? conn.receiverId
          : conn.senderId
      );

      setConnections(mapped);

      // ✅ Auto select ONLY from connections
      setSelectedUser((prev) => {
        if (prev) return prev;
        return null;
      });
    } catch (err) {
      console.error("Connections fetch error:", err);
    }
  };


  // 🔍 Search user by email
  const handleSearch = async () => {
    try {
      if (!searchEmail.trim()) return;

      setSearchError("");
      setSearchResult(null);

      const res = await fetch(`${BASE_URL}/users/search?email=${searchEmail}`);

      if (!res.ok) {
        setSearchResult(null);
        setSearchError("User not found");
        return;
      }

      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      console.error("Search API crash:", err);
      setSearchError("Something went wrong. Try again.");
    }
  };

  // 📤 Send connection request
  const handleSendRequest = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !searchResult) return;

      if (user._id === searchResult._id) {
        alert("You cannot send a request to yourself");
        return;
      }

      const res = await fetch(`${BASE_URL}/connections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: user._id,
          receiverId: searchResult._id,
          note: requestNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // ✅ FIX: Proper error handling
        if (data.error === "Connection already exists or pending") {
          alert("Connection request already exists or is pending");
          return;
        }

        console.warn(data.error || "Failed to send request");
        return;
      }

      alert("Request sent!");
      setSearchResult(null);
      setSearchEmail("");
      setRequestNote("");
    } catch (err) {
      console.error("Request error:", err);
      alert(err.message);
    }
  };


  // ✅ Send Message
  const handleConnectionAction = async (id, status) => {
    try {
      const res = await fetch(`${BASE_URL}/connections/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.warn(data.error || "Action failed");
        return;
      }

      // ✅ STEP 1: Remove from pending list
      setPendingRequests((prev) =>
        prev.filter((req) => req._id !== id)
      );

      // ✅ STEP 2: If accepted, add to the connections list immediately
      if (status === "accepted") {
        // We find the other person's ID (if I am receiver, they are sender)
        const otherUser = data.connection.senderId === currentUser._id 
          ? data.connection.receiverId 
          : data.connection.senderId;

        setConnections((prev) => {
          if (prev.includes(otherUser)) return prev;
          return [otherUser, ...prev];
        });
      }

      alert(`Request ${status}`);
    } catch (err) {
      console.error("Action error:", err);
      alert(err.message);
    }
  };


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

  if (isCheckingAuth) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">

      {/* SIDEBAR */}
      {showSidebar && (
        <div className="w-full md:w-1/4 bg-slate-900 text-gray-300 p-4 border-r border-slate-700 shadow-xl">
          <div className="flex items-center justify-between w-full mb-4 relative">

            <h2 className="font-bold">Users</h2>

            <div className="flex items-center gap-2">

              {/* Search Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSearch((prev) => !prev);
                }}
                className="text-white bg-slate-700 p-2 rounded-lg hover:bg-slate-600"
              >
                🔍
              </button>


              {/* show search */}
            
              {showSearch && (
                <SearchPopup
                  searchRef={searchRef}
                  searchEmail={searchEmail}
                  setSearchEmail={setSearchEmail}
                  handleSearch={handleSearch}
                  searchError={searchError}
                  searchResult={searchResult}
                  requestNote={requestNote}
                  setRequestNote={setRequestNote}
                  handleSendRequest={handleSendRequest}
                />
              )}


              {/* Avatar/Profile */}
              <ProfileMenu
                currentUser={currentUser}
                showProfileMenu={showProfileMenu}
                setShowProfileMenu={setShowProfileMenu}
                socketRef={socketRef}
                setSelectedUser={setSelectedUser}
                setCurrentUser={setCurrentUser}
                router={router}
              />  
            </div>
          </div>



          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-4">

              <h3 className="text-sm font-semibold mb-2">Requests</h3>

              {pendingRequests.map((req) => (
                <div key={req._id} className="bg-slate-800 p-2 rounded mb-2">

                  <p className="text-sm">
                    {userMap[req.senderId] || "User"}
                  </p>

                  {req.note && (
                    <p className="text-xs text-gray-400">{req.note}</p>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleConnectionAction(req._id, "accepted")}
                      className="flex-1 bg-green-600 text-white p-1 rounded text-xs"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleConnectionAction(req._id, "rejected")}
                      className="flex-1 bg-red-600 text-white p-1 rounded text-xs"
                    >
                      Reject
                    </button>
                  </div>

                </div>
              ))}

            </div>
          )}

          {connections
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
          <ChatHeader
            selectedUser={selectedUser}
            userMap={userMap}
            users={users}
            typingUser={typingUser}
            setShowSidebar={setShowSidebar}
          />

          {!selectedUser && (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a user to start chatting
            </div>
          )}

          {/* MESSAGES */}
          <MessageList
            messages={messages}
            selectedUser={selectedUser}
            socketId={socketId}
            messageEndRef={messageEndRef}
          />

          {/* Typing indicator */}
          {typingUser === selectedUser && (
            <div className="text-sm text-gray-500 px-4 pb-2">
              {userMap[selectedUser] ? userMap[selectedUser] : "User"} is typing...
            </div>
          )}

          {/* INPUT AREA */}
          <MessageInput
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
            selectedUser={selectedUser}
            socketRef={socketRef}
            typingDebounceRef={typingDebounceRef}
          />
        </div>
      )}
    </div>
  );
}