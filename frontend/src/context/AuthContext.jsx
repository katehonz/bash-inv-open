import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { GET_ME } from '../graphql/queries';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const client = useApolloClient();

  const fetchUser = async (authToken) => {
    try {
      const { data } = await client.query({
        query: GET_ME,
        context: {
          headers: {
            authorization: authToken ? `Bearer ${authToken}` : '',
          }
        },
        fetchPolicy: 'network-only',
      });
      setUser(data.me);
      localStorage.setItem('authUser', JSON.stringify(data.me));
      return true;
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        await fetchUser(storedToken);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (authResponse) => {
    const { token } = authResponse;

    setToken(token);
    localStorage.setItem('authToken', token);
    await fetchUser(token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('activeCompanyId');
    client.resetStore();
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};