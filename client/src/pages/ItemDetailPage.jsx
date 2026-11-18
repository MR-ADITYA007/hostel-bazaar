import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteItem, getItem } from '../api/itemApi';
import api from '../api/axiosInstance';

const CONDITION_COLORS = {
  New: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Like New': 'bg-teal-100 text-teal-800 border-teal-200',
  Good: 'bg-blue-100 text-blue-800 border-blue-200',
  Fair: 'bg-amber-100 text-amber-800 border-amber-200',
  Poor: 'bg-red-100 text-red-800 border-red-200',
};

const CATEGORY_ICONS = {
  Books: '📚', Electronics: '💻', Stationery: '✏️', Clothing: '👕',
  Bicycles: '🚲', 'Lab Equipment': '🔬', 'Hostel Essentials': '🏠', Other: '📦',
};

export default function ItemDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState('');

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getItem(id)
      .then((res) => setItem(res.data.data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleMessageSeller() {
    setMsgLoading(true);
    setMsgError('');
    try {
      const res = await api.post('/chat/conversations', { itemId: id });
      navigate(`/inbox/${res.data.data._id}`);
    } catch {
      setMsgError('Could not start conversation. Please try again.');
      setMsgLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await deleteItem(id);
      navigate('/');
    } catch {
      alert('Failed to delete the listing.');
    }
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl h-80 bg-gray-200" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded-lg w-3/4" />
              <div className="h-10 bg-gray-200 rounded-lg w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !item) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <div className="text-6xl">🔍</div>
        <p className="text-xl font-bold text-gray-700">Item not found</p>
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors">
          ← Back to listings
        </Link>
      </main>
    );
  }

  const isSeller = user && item.seller?._id === user._id;
  const isSold = item.status === 'Sold';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to listings
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left — image */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title}
                className="w-full h-80 md:h-96 object-contain bg-gray-50" />
            ) : (
              <div className="w-full h-80 md:h-96 flex items-center justify-center text-8xl bg-gradient-to-br from-indigo-50 to-violet-100">
                {CATEGORY_ICONS[item.category] ?? '📦'}
              </div>
            )}
            {isSold && (
              <div className="bg-red-50 border-t border-red-100 px-4 py-2 text-center">
                <span className="text-red-600 font-bold text-sm tracking-wide">🚫 THIS ITEM HAS BEEN SOLD</span>
              </div>
            )}
          </div>

          {/* Right — details + CTA */}
          <div className="flex flex-col gap-5">
            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-200">
                  {CATEGORY_ICONS[item.category]} {item.category}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${CONDITION_COLORS[item.condition] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {item.condition}
                </span>
                {isSold && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                    SOLD
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{item.title}</h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-400 font-medium">₹</span>
              <span className="text-4xl font-black bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
                {item.price.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h2>
              <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{item.description}</p>
            </div>

            {/* Seller info */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {item.seller?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.seller?.name ?? 'Unknown'}</p>
                <p className="text-xs font-mono text-gray-400">{item.seller?.usn ?? ''}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-400">Listed</p>
                <p className="text-xs text-gray-500 font-medium">
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {isSeller ? (
                <div className="flex gap-3">
                  <button onClick={() => navigate(`/items/${id}/edit`)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-sm shadow transition-all">
                    ✏️ Edit Listing
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors">
                    🗑️ Delete
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={handleMessageSeller}
                    disabled={isSold || msgLoading || !user}
                    className="w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                      bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white hover:shadow-xl hover:-translate-y-0.5">
                    {msgLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Opening chat…
                      </span>
                    ) : '💬 Message Seller'}
                  </button>
                  {!user && (
                    <p className="text-center text-xs text-gray-400">
                      <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link> to message the seller
                    </p>
                  )}
                  {msgError && <p className="text-xs text-red-600 text-center">{msgError}</p>}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
