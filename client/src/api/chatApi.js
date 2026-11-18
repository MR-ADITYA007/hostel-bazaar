import api from './axiosInstance';

export const createOrFetchConversation = (itemId) =>
  api.post('/chat/conversations', { itemId });

export const getInbox = () =>
  api.get('/chat/conversations');

export const getMessages = (convId, page = 1) =>
  api.get(`/chat/conversations/${convId}/messages`, { params: { page } });

export const postMessage = (convId, text) =>
  api.post(`/chat/conversations/${convId}/messages`, { text });
