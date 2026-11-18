import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMessages } from '../api/chatApi';

export default function ChatWindow({ conversationId, onNewMessage }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const prevConvIdRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    if (prevConvIdRef.current && socket) {
      socket.emit('leave_conversation', { conversationId: prevConvIdRef.current });
    }
    prevConvIdRef.current = conversationId;
    setMessages([]);
    setLoading(true);
    if (socket) socket.emit('join_conversation', { conversationId });
    getMessages(conversationId)
      .then((res) => setMessages(res.data.data || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
    return () => { if (socket) socket.emit('leave_conversation', { conversationId }); };
  }, [conversationId, socket]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    const handleReceive = (msg) => {
      if (msg.conversationId === conversationId && msg.sender._id !== user._id) {
        setMessages((prev) => [...prev, msg]);
        if (onNewMessage) onNewMessage(msg);
      }
    };
    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
  }, [socket, conversationId, user._id, onNewMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (newText.trim() === '') return;
    setSending(true);
    const optimisticMsg = {
      _id: 'temp-' + Date.now(),
      sender: { _id: user._id, name: user.name },
      text: newText.trim(),
      createdAt: new Date().toISOString(),
      conversationId,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    if (socket) socket.emit('send_message', { conversationId, text: newText.trim() });
    setNewText('');
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!conversationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400 select-none p-8">
        <div className="text-5xl">💬</div>
        <p className="font-medium text-gray-500">Select a conversation</p>
        <p className="text-sm text-center text-gray-400">Pick a chat from the left to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              <p className="text-xs text-gray-400">Loading messages…</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-4xl">👋</div>
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400">Say hello to start negotiating!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender._id === user._id;
            return (
              <div key={msg._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <span className="text-[11px] text-gray-400 mb-1 ml-1 font-medium">{msg.sender.name}</span>
                )}
                <div className={`max-w-xs lg:max-w-sm xl:max-w-md px-4 py-2.5 text-sm break-words leading-relaxed shadow-sm ${
                  isOwn
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 mx-1">{formatTime(msg.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 p-3 flex gap-2 items-end bg-white">
        <textarea
          rows={1}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message… (Enter to send)"
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent max-h-28 overflow-y-auto bg-gray-50 focus:bg-white transition"
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={sending || newText.trim() === ''}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
