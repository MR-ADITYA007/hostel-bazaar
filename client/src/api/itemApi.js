import api from './axiosInstance';

export const getFeed = (params) => api.get('/items', { params });
export const getItem = (id) => api.get(`/items/${id}`);
export const createItem = (formData) => api.post('/items', formData);
export const updateItem = (id, formData) => api.put(`/items/${id}`, formData);
export const deleteItem = (id) => api.delete(`/items/${id}`);
export const toggleStatus = (id) => api.patch(`/items/${id}/status`);
export const getMyListings = () => api.get('/items/my');
