export default function SidebarHeader({
  currentUser,
  showProfileMenu,
  setShowProfileMenu,
  showSearch,
  setShowSearch,
}) {
  return (
    <div className="flex items-center justify-between mb-4 relative">

      <h2 className="font-bold">Users</h2>

      <div className="flex items-center gap-2">

        {/* Search Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSearch((prev) => !prev);
          }}
          className="text-white bg-slate-700 p-2 rounded-lg"
        >
          🔍
        </button>

        {/* Profile */}
        <div className="relative">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu((prev) => !prev);
            }}
            className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer"
          >
            {currentUser?.name?.[0] || "?"}
          </div>
        </div>

      </div>
    </div>
  );
}