export default function ProfileMenu({
  currentUser,
  showProfileMenu,
  setShowProfileMenu,
  socketRef,
  setSelectedUser,
  setCurrentUser,
  router,
}) {
  return (
    <div className="relative">
      {/* Avatar */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setShowProfileMenu((prev) => !prev);
        }}
        className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-600 transition"
      >
        {currentUser?.name?.[0] || "?"}
      </div>

      {/* Dropdown */}
      {showProfileMenu && (
        <div className="absolute right-0 mt-2 w-52 bg-slate-800 text-white rounded-xl shadow-xl p-3 z-50 border border-slate-700">

          <div className="absolute -top-2 right-3 w-3 h-3 bg-slate-800 rotate-45 border-l border-t border-slate-700"></div>

          {currentUser ? (
            <>
              <p className="text-sm font-semibold truncate">
                {currentUser.name}
              </p>

              <p className="text-xs text-gray-400 mb-3 truncate">
                {currentUser.email}
              </p>

              <button
                onClick={() => {
                  socketRef.current?.disconnect();
                  localStorage.removeItem("user");
                  setSelectedUser(null);
                  setCurrentUser(null);
                  setShowProfileMenu(false);
                  router.replace("/auth");
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setShowProfileMenu(false);
                router.push("/auth");
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm transition"
            >
              Login
            </button>
          )}
        </div>
      )}
    </div>
  );
}