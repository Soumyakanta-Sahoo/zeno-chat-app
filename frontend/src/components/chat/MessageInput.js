export default function MessageInput({
  message,
  setMessage,
  sendMessage,
  selectedUser,
  socketRef,
  typingDebounceRef,
}) {
  return (
    <div className="p-4 bg-transparent">
      <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
        <input
          type="text"
          className="flex-1 bg-transparent text-white border-none px-4 py-2 outline-none placeholder-slate-500"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);

            if (!selectedUser) return;

            if (typingDebounceRef.current) {
              clearTimeout(typingDebounceRef.current);
            }

            typingDebounceRef.current = setTimeout(() => {
              socketRef.current.emit("typing", {
                to: selectedUser,
              });
            }, 300);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
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
  );
}