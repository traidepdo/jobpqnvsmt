export default function Search({ handleSearch, searchValue, setSearchValue }: {
    handleSearch: (query: string) => void,
    searchValue: string,
    setSearchValue: (value: string) => void,
}) {
    return (
        <div className="flex gap-2 max-w-lg w-full">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    name="search"
                    id="search"
                    placeholder="Tìm kiếm bài viết, tin tức..."
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-900"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch(searchValue);
                        }
                    }}
                />
            </div>
            <button
                onClick={() => handleSearch(searchValue)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all text-sm duration-200"
            >
                Tìm kiếm
            </button>
        </div>
    )
}