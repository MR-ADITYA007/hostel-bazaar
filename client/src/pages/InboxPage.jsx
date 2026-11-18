import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getInbox } from '../api/chatApi';
import ChatWindow from '../components/ChatWindow';

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function InboxPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { convId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeConvId = convId || null;

  useEffect(() => {
    getInbox()
      .then((res) => setConversations(res.data.data || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleReceive = (msg) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === msg.conversationId);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], lastMessage: msg.text, updatedAt: msg.createdAt };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      });
    };
    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
  }, [socket]);

  const handleNewMessage = useCallback((msg) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c._id === msg.conversationId);
      if (idx === -1) return prev;
      const updated = { ...prev[idx], lastMessage: msg.text, updatedAt: msg.createdAt };
      return [updated, ...prev.filter((_, i) => i !== idx)];
    });
  }, []);

  const getOtherParty = (conv) => {
    if (!user) return { name: '', usn: '' };
    const isBuyer = conv.buyer?._id === user._id || conv.buyer === user._id;
    return isBuyer
      ? { name: conv.seller?.name || 'Seller', usn: conv.seller?.usn || '' }
      : { name: conv.buyer?.name || 'Buyer', usn: conv.buyer?.usn || '' };
  };

  const activeConv = conversations.find((c) => c._id === activeConvId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex max-w-6xl w-full mx-auto my-4 px-4 gap-0 overflow-hidden" style={{ height: 'calc(100vh - 7rem)' }}>
        {/* LEFT PANEL */}
        <div className="w-80 flex-shrink-0 bg-white rounded-l-2xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50">
            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Inbox
            </h2>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 border-b border-gray-50 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                    <div className="h-3 bg-gray-200 rounded-full w-5/6" />
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm font-semibold text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Message a seller to get started</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParty(conv);
                const isActive = conv._id === activeConvId;
                return (
                  <div key={conv._id} onClick={() => navigate(`/inbox/${conv._id}`)}
                    className={`flex gap-3 p-4 cursor-pointer transition-all border-b border-gray-50 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border-l-4 border-l-indigo-500'
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}>
                    {/* Item thumbnail */}
                    {conv.item?.imageUrl ? (
                      <img src={conv.item.imageUrl} alt={conv.item?.title}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0 text-xl">
                        🛍️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-800' : 'text-gray-800'}`}>
                          {conv.item?.title || 'Unknown Item'}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{relTime(conv.updatedAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {other.name[0]?.toUpperCase()}
                        </span>
                        {other.name}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-400 truncate mt-0.5 italic">{conv.lastMessage}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white rounded-r-2xl border border-l-0 border-gray-200 flex flex-col overflow-hidden shadow-sm">
          {/* Chat header */}
          {activeConv && (
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center gap-3">
              {activeConv.item?.imageUrl ? (
                <img src={activeConv.item.imageUrl} alt={activeConv.item?.title}
                  className="w-9 h-9 rounded-lg object-cover shadow-sm" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-lg">🛍️</div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-800 leading-tight">{activeConv.item?.title || 'Item'}</p>
                <p className="text-xs text-gray-500">
                  Chat with <span className="font-semibold text-indigo-600">{getOtherParty(activeConv).name}</span>
                </p>
              </div>
            </div>
          )}

          {activeConvId ? (
            <ChatWindow conversationId={activeConvId} onNewMessage={handleNewMessage} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400 p-8 select-none">
              <div className="text-5xl">💬</div>
              <p className="font-semibold text-gray-500">Your messages</p>
              <p className="text-sm text-center text-gray-400">Select a conversation from the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
