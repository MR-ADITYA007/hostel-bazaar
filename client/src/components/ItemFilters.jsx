import { useEffect, useRef, useState } from 'react';

const CATEGORIES = [
  'Books', 'Electronics', 'Stationery', 'Clothing',
  'Bicycles', 'Lab Equipment', 'Hostel Essentials', 'Other',
];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const CATEGORY_ICONS = {
  Books: '📚', Electronics: '💻', Stationery: '✏️', Clothing: '👕',
  Bicycles: '🚲', 'Lab Equipment': '🔬', 'Hostel Essentials': '🏠', Other: '📦',
};

const EMPTY_FILTERS = { search: '', category: '', condition: '', minPrice: '', maxPrice: '' };

export default function ItemFilters({ filters, onFilterChange }) {
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const debounceRef = useRef(null);

  useEffect(() => { setSearchInput(filters.search ?? ''); }, [filters.search]);

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onFilterChange({ ...filters, search: value }), 400);
  }

  const hasActiveFilters = filters.category || filters.condition || filters.minPrice || filters.maxPrice || filters.search;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-4 mb-8">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex flex-col gap-1 min-w-[200px] flex-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Search</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search listings…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
          <select
            value={filters.category ?? ''}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 focus:bg-white transition appearance-none pr-8 cursor-pointer"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Condition</label>
          <select
            value={filters.condition ?? ''}
            onChange={(e) => onFilterChange({ ...filters, condition: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 focus:bg-white transition appearance-none pr-8 cursor-pointer"
          >
            <option value="">Any Condition</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Price range */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price Range (₹)</label>
          <div className="flex items-center gap-2">
            <input
              type="number" min="0"
              value={filters.minPrice ?? ''}
              onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
              placeholder="Min"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 focus:bg-white transition"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="number" min="0"
              value={filters.maxPrice ?? ''}
              onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
              placeholder="Max"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchInput(''); onFilterChange({ ...EMPTY_FILTERS }); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold transition-colors border border-red-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
