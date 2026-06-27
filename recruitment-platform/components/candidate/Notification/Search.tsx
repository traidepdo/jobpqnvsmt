export default function Search({
    searchQuery,
    setSearchQuery
}: {
    searchQuery: string;
    setSearchQuery: (searchQuery: string) => void;
}) {
    return (
        <div className="relative mb-3">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                search
            </span>
            <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00b14f] focus:ring-1 focus:ring-[#00b14f] transition-all text-[#041b3c] placeholder-gray-400 shadow-sm"
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            )}
        </div>
    )
}