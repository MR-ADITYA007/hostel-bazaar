import { Link } from 'react-router-dom';

const CONDITION_COLORS = {
  New: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Like New': 'bg-teal-100 text-teal-800 border-teal-200',
  Good: 'bg-blue-100 text-blue-800 border-blue-200',
  Fair: 'bg-amber-100 text-amber-800 border-amber-200',
  Poor: 'bg-red-100 text-red-800 border-red-200',
};

const CATEGORY_ICONS = {
  Books: '📚', Electronics: '💻', Stationery: '✏️',
  Clothing: '👕', Bicycles: '🚲', 'Lab Equipment': '🔬',
  'Hostel Essentials': '🏠', Other: '📦',
};

function relativeDate(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function ItemCard({ item, onEdit, onDelete, onToggleStatus }) {
  const hasActions = onEdit || onDelete || onToggleStatus;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col border border-gray-100">
      <Link to={`/items/${item._id}`} className="flex flex-col flex-1">
        {/* Image */}
        <div className="relative w-full h-48 bg-gray-100 overflow-hidden flex-shrink-0">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-indigo-50 to-violet-100">
              {CATEGORY_ICONS[item.category] ?? '📦'}
            </div>
          )}

          {/* Category chip on image */}
          <div className="absolute top-2 left-2">
            <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {CATEGORY_ICONS[item.category]} {item.category}
            </span>
          </div>

          {/* Sold overlay */}
          {item.status === 'Sold' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="border-4 border-white px-4 py-1.5 rotate-[-15deg]">
                <span className="text-white font-black text-2xl tracking-widest drop-shadow-lg">SOLD</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug mb-2">
            {item.title}
          </h3>

          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-xs text-gray-400 font-medium">₹</span>
            <span className="text-xl font-extrabold bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
              {item.price.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CONDITION_COLORS[item.condition] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              {item.condition}
            </span>
          </div>

          <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                {item.seller?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="text-xs text-gray-500 font-mono truncate max-w-[80px]">{item.seller?.usn ?? ''}</span>
            </div>
            <span className="text-xs text-gray-400">{relativeDate(item.createdAt)}</span>
          </div>
        </div>
      </Link>

      {/* Action bar */}
      {hasActions && (
        <div className="flex border-t border-gray-100 divide-x divide-gray-100 bg-gray-50/50">
          {onEdit && (
            <button onClick={() => onEdit(item)}
              className="flex-1 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          )}
          {onToggleStatus && (
            <button onClick={() => onToggleStatus(item)}
              className="flex-1 py-2.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {item.status === 'Active' ? 'Mark Sold' : 'Relist'}
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(item)}
              className="flex-1 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
