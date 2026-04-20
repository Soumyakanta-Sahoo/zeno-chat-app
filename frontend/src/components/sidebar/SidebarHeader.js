import ProfileMenu from "./ProfileMenu";
import SearchPopup from "./SearchPopup";
import PendingRequests from "./PendingRequests";

export default function SidebarHeader({
  showSearch,
  setShowSearch,
  sidebarView,
  setSidebarView,
  searchRef,

  searchEmail,
  setSearchEmail,
  handleSearch,
  searchError,
  searchResult,

  requestNote,
  setRequestNote,
  handleSendRequest,

  pendingRequests,
  userMap,
  handleConnectionAction,

  currentUser,
  showProfileMenu,
  setShowProfileMenu,
  socketRef,
  setSelectedUser,
  setCurrentUser,
  router,
}) {
  return (
    <div className="flex items-center justify-between w-full mb-4 relative">

      {/* Brand */}
      <h2 className="text-xl font-bold tracking-wide text-white">
        ZENO
      </h2>

      {/* Right Icons */}
      <div className="flex items-center gap-2">

        {/* Search */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSearch((prev) => !prev);
            setSidebarView("chats");
          }}
          className="relative text-white bg-slate-700 p-2 rounded-lg hover:bg-slate-600 transition"
          title="Search"
        >
          🔍
        </button>

        {/* Bell */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSidebarView("requests");
            setShowSearch(false);
          }}
          className="relative text-white bg-slate-700 p-2 rounded-lg hover:bg-slate-600 transition"
          title="Requests"
        >
          🔔

          {pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>

        {/* Profile */}
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

      {/* Search Popup */}
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

    </div>
  );
}