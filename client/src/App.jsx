import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import PostItemPage from './pages/PostItemPage';
import EditItemPage from './pages/EditItemPage';
import ItemDetailPage from './pages/ItemDetailPage';
import MyListingsPage from './pages/MyListingsPage';
import InboxPage from './pages/InboxPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<FeedPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/items/post" element={<PostItemPage />} />
              <Route path="/items/:id/edit" element={<EditItemPage />} />
              <Route path="/items/:id" element={<ItemDetailPage />} />
              <Route path="/my-listings" element={<MyListingsPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/inbox/:convId" element={<InboxPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
