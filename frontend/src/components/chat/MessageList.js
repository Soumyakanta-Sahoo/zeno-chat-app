export default function MessageList({
  messages,
  selectedUser,
  socketId,
  messageEndRef,
}) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-32 pb-4 space-y-4 bg-linear-to-b from-slate-950 via-gray-900 to-slate-800">
      {(messages[selectedUser] || []).map((msg) => {
        const isMe = msg.senderId === socketId;

        return (
          <div
            key={msg.timestamp + msg.senderId}
            className={`flex ${
              isMe ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[70%] text-[15px] shadow-sm transition-all hover:shadow-md ${
                isMe
                  ? "bg-blue-600 text-white rounded-tr-none self-end"
                  : "bg-slate-100 text-slate-800 rounded-tl-none self-start border border-slate-700/50"
              }`}
            >
              <div className="leading-relaxed">
                {msg.text}
              </div>

              <div className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}

                {isMe && (
                    <span
                        className={`text-[10px] ml-1.5 font-semibold ${
                            msg.seen
                                ? "text-red-500"
                                : msg.delivered
                                ? "text-slate-200"
                                : "text-slate-400"
                        }`}
                    >
                        {msg.seen
                        ? "✓✓"
                        : msg.delivered
                        ? "✓✓"
                        : "✓"}
                    </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div ref={messageEndRef} />
    </div>
  );
}