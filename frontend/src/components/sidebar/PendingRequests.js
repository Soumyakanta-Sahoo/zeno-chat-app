export default function PendingRequests({
  pendingRequests,
  userMap,
  handleConnectionAction,
}) {
  if (!pendingRequests.length) return null;

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold mb-2 text-white">
        Requests
      </h3>

      {pendingRequests.map((req) => (
        <div
          key={req._id}
          className="bg-slate-800 p-3 rounded-xl mb-2 border border-slate-700"
        >
          <p className="text-sm font-medium text-white">
            {userMap[req.senderId] || req.senderName || "User"}
          </p>

          {req.note && (
            <p className="text-xs text-gray-400 mt-1">
              {req.note}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() =>
                handleConnectionAction(
                  req._id,
                  "accepted"
                )
              }
              className="flex-1 bg-green-600 hover:bg-green-500 text-white py-1.5 rounded-lg text-xs transition"
            >
              Accept
            </button>

            <button
              onClick={() =>
                handleConnectionAction(
                  req._id,
                  "rejected"
                )
              }
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-1.5 rounded-lg text-xs transition"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}