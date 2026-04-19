export default function ChatHeader({
  selectedUser,
  userMap,
  users,
  typingUser,
  setShowSidebar,
}) {
  const isOnline = users.includes(selectedUser);

  return (
    <div className="absolute top-4 left-4 right-4 p-4 bg-slate-800/85 backdrop-blur-xl border border-slate-700/60 rounded-2xl flex items-center gap-3 shadow-xl z-20">
      
      {/* Back Button */}
      <button
        onClick={() => setShowSidebar(true)}
        className="md:hidden text-white text-lg px-2 py-1 rounded-lg hover:bg-slate-700 transition"
      >
        ←
      </button>

      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center rounded-full font-semibold shadow-inner ring-2 ring-slate-900">
          {userMap[selectedUser]?.[0] || "?"}
        </div>

        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
        )}
      </div>

      {/* User Details */}
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-white truncate">
          {userMap[selectedUser] || "Select a user"}
        </h2>

        {selectedUser && (
          <p
            className={`text-xs ${
              typingUser === selectedUser
                ? "text-blue-300"
                : isOnline
                ? "text-green-400"
                : "text-gray-400"
            }`}
          >
            {typingUser === selectedUser
              ? "Typing..."
              : isOnline
              ? "Online"
              : "Offline"}
          </p>
        )}
      </div>
    </div>
  );
}