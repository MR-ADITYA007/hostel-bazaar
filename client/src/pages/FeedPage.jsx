import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import ItemFilters from '../components/ItemFilters';
import { getFeed } from '../api/itemApi';

const EMPTY_FILTERS = { search: '', category: '', condition: '', minPrice: '', maxPrice: '' };

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="w-full h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
        <div className="h-6 bg-gray-200 rounded-lg w-1/3" />
        <div className="h-4 bg-gray-200 rounded-full w-1/4" />
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchFeed = useCallback(async (activeFilters, page, append = false) => {
    try {
      const params = Object.fromEntries(
        Object.entries({ ...activeFilters, page }).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      const res = await getFeed(params);
      const { data } = res.data;
      if (append) setItems((prev) => [...prev, ...data.items]);
      else setItems(data.items);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch {
      if (!append) setError('Failed to load listings. Please try again.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchFeed(filters, 1, false).finally(() => setLoading(false));
  }, [filters, fetchFeed]);

  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchFeed(filters, pagination.page + 1, true);
    setLoadingMore(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Campus Marketplace 🏕️
            </h1>
            <p className="text-white/70 mt-1 text-sm">
              {pagination.total > 0
                ? `${pagination.total} listing${pagination.total !== 1 ? 's' : ''} from your campus`
                : 'Find great deals from fellow hostelites'}
            </p>
          </div>
          {user && (
            <Link
              to="/items/post"
              className="flex-shrink-0 flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Post an Item
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ItemFilters filters={filters} onFilterChange={setFilters} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-gray-400">
            <div className="text-7xl mb-4">🛍️</div>
            <p className="text-xl font-bold text-gray-500">No listings found</p>
            <p className="text-sm mt-1 text-gray-400">Be the first to post something!</p>
            {user && (
              <Link to="/items/post"
                className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow">
                + Post an Item
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => <ItemCard key={item._id} item={item} />)}
            </div>

            {pagination.page < pagination.pages && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold disabled:opacity-60 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading…
                    </>
                  ) : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
