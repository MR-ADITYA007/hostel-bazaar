import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const linkCls = ({ isActive }) =>
    `text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
      isActive
        ? 'bg-white/20 text-white'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight hidden sm:block">
            Hostel<span className="text-yellow-300">Bazaar</span>
          </span>
        </Link>

        {/* Desktop nav */}
        {user ? (
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <NavLink to="/" end className={linkCls}>Browse</NavLink>
            <NavLink to="/items/post" className={linkCls}>+ Post Item</NavLink>
            <NavLink to="/my-listings" className={linkCls}>My Listings</NavLink>
            <NavLink to="/inbox" className={linkCls}>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Inbox
              </span>
            </NavLink>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-900">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-white/80 text-xs font-mono">{user.usn?.toUpperCase()}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-medium bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full transition-all duration-200 border border-white/20"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm text-white/80 hover:text-white px-3 py-1.5 transition-colors">
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-white text-indigo-700 hover:bg-yellow-300 hover:text-indigo-900 px-4 py-1.5 rounded-full transition-all duration-200 shadow"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
