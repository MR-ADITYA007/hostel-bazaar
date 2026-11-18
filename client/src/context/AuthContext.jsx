import { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user from session on mount
  useEffect(() => {
    axiosInstance
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(usnRaw, password) {
    const res = await axiosInstance.post('/auth/login', { usn: usnRaw, password });
    setUser(res.data.data);
    return res.data;
  }

  async function register(usnRaw, name, password) {
    const res = await axiosInstance.post('/auth/register', { usn: usnRaw, name, password });
    setUser(res.data.data);
    return res.data;
  }

  async function logout() {
    await axiosInstance.post('/auth/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
