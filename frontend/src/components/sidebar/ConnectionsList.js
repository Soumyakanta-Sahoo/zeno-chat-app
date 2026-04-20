export default function ConnectionsList({
  connections,
  messages,
  selectedUser,
  setSelectedUser,
  setMessage,
  unread,
  setUnread,
  users,
  userMap,
  typingUser,
  socketId,
  setShowSidebar,
}) {
  const sortedConnections = [...connections].sort(
    (a, b) => {
      const lastA =
        messages[a]?.[
          messages[a].length - 1
        ]?.timestamp || 0;

      const lastB =
        messages[b]?.[
          messages[b].length - 1
        ]?.timestamp || 0;

      return (
        new Date(lastB) -
        new Date(lastA)
      );
    }
  );

  return (
    <>
      {sortedConnections.map((user) => {
        const lastMsg =
          messages[user]?.[
            messages[user].length - 1
          ];

        return (
          <div
            key={user}
            onClick={() => {
              if (user === socketId) return;

              setSelectedUser(user);
              setMessage("");

              setUnread((prev) => ({
                ...prev,
                [user]: 0,
              }));

              if (
                window.innerWidth < 768
              ) {
                setShowSidebar(false);
              }
            }}
            className={`p-4 rounded-xl cursor-pointer mb-3 transition-all duration-200 border ${
              selectedUser === user
                ? "bg-blue-600 border-blue-400 shadow-lg translate-x-1"
                : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/70 hover:border-slate-600"
            }`}
          >
            <div className="flex justify-between items-center">

              {/* Left */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center rounded-full text-sm">
                      {userMap[user]?.[0] ||
                        "?"}
                    </div>

                    {users.includes(
                      user
                    ) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></span>
                    )}
                  </div>

                  <span className="font-medium text-white">
                    {userMap[user] ??
                      "Loading..."}
                  </span>
                </div>

                <span className="text-xs text-gray-400 truncate max-w-35">
                  {typingUser === user
                    ? "Typing..."
                    : lastMsg
                    ? lastMsg.text
                    : "No messages yet"}
                </span>
              </div>

              {/* Right */}
              <div className="flex flex-col items-end gap-1">
                {lastMsg && (
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(
                      lastMsg.timestamp
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute:
                          "2-digit",
                      }
                    )}
                  </span>
                )}

                {unread[user] > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-5 text-center">
                    {unread[user]}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}