import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('apextask_theme') || 'dark');
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('apextask_theme', theme);
  }, [theme]);

  // Load existing session
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('apextask_token');
      if (token) {
        try {
          const res = await api.auth.me();
          setUser(res.user);
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          localStorage.removeItem('apextask_token');
          setUser(null);
        }
      }
      try {
        const compRes = await api.auth.getCompanies();
        setCompanies(compRes.companies || []);
      } catch (err) {
        console.error('Failed to load companies:', err);
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password, role) => {
    const res = await api.auth.login({ email, password, role });
    localStorage.setItem('apextask_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('apextask_token');
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        companies,
        login,
        logout,
        toggleTheme,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
