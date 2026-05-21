export default function MessageList({
  messages,
  selectedUser,
  socketId,
  messageEndRef,
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-6 pt-32 pb-4 space-y-4 bg-linear-to-b from-slate-950 via-gray-900 to-slate-800">
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
              className={`px-4 py-2 rounded-2xl max-w-[70%] text-[15px] shadow-sm transition-all hover:shadow-md break-words ${
                isMe
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-700/50"
              }`}
            >
              {/* Message Text */}
              <div className="leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </div>

              {/* Time + Tick */}
              <div className="mt-1 flex justify-end items-center gap-1 text-[11px] opacity-80">
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {isMe && (
                  <span
                    className={`leading-none font-semibold ${
                      msg.seen
                        ? "text-cyan-300"
                        : msg.delivered
                        ? "text-slate-200"
                        : "text-slate-400"
                    }`}
                  >
                    {msg.seen || msg.delivered ? "✓✓" : "✓"}
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