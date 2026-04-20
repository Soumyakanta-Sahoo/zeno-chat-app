export default function SearchPopup({
  searchRef,
  searchEmail,
  setSearchEmail,
  handleSearch,
  searchError,
  searchResult,
  requestNote,
  setRequestNote,
  handleSendRequest,
}) {
  return (
    <div
      ref={searchRef}
      className="absolute top-12 right-12 w-72 bg-slate-800 p-3 rounded-xl shadow-xl z-50 border border-slate-700"
    >
      <input
        type="text"
        placeholder="Search by email..."
        value={searchEmail}
        onChange={(e) =>
          setSearchEmail(e.target.value)
        }
        className="w-full p-2 rounded bg-slate-700 text-white mb-2 outline-none"
      />

      <button
        onClick={handleSearch}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition"
      >
        Search
      </button>

      {searchError && (
        <p className="text-red-400 text-sm mt-2 text-center">
          {searchError}
        </p>
      )}

      {searchResult && (
        <div className="mt-3 p-3 bg-slate-700 rounded-lg">
          <p className="font-medium text-white">
            {searchResult.name}
          </p>

          <p className="text-xs text-gray-300 mb-2 truncate">
            {searchResult.email}
          </p>

          <textarea
            placeholder="Add note..."
            value={requestNote}
            onChange={(e) =>
              setRequestNote(e.target.value)
            }
            className="w-full mt-2 p-2 rounded bg-slate-600 text-white resize-none outline-none"
            rows="3"
          />

          <button
            onClick={handleSendRequest}
            className="mt-2 w-full bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition"
          >
            Send Request
          </button>
        </div>
      )}
    </div>
  );
}