import React from "react";
import { FiSearch } from "react-icons/fi";

interface Category {
  id: string;
  name: string;
}

interface FilterToolbarProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedExperience: string;
  setSelectedExperience: (val: string) => void;
  categories: Category[];
  expLabels: Record<string, string>;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
}

export default function FilterToolbar({
  searchInput,
  setSearchInput,
  selectedCategory,
  setSelectedCategory,
  selectedExperience,
  setSelectedExperience,
  categories,
  expLabels,
  onSearchSubmit,
  onClearSearch,
}: FilterToolbarProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-md">
      <form onSubmit={onSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search bar */}
        <div className="relative md:col-span-5">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc từ khóa..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:bg-white/10 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#0e121d] border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
          >
            <option value="">Tất cả ngành nghề</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Experience Dropdown */}
        <div className="md:col-span-3">
          <select
            value={selectedExperience}
            onChange={e => setSelectedExperience(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#0e121d] border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
          >
            <option value="">Tất cả kinh nghiệm</option>
            {Object.entries(expLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="md:col-span-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-600/10 cursor-pointer flex items-center justify-center gap-1.5"
        >
          Lọc
        </button>
      </form>
    </div>
  );
}
