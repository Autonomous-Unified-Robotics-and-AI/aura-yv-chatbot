"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminAuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('admin-token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const login = async (adminToken: string): Promise<boolean> => {
    setError(null);
    
    try {
      // Test the token by making a simple API call
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        setToken(adminToken);
        localStorage.setItem('admin-token', adminToken);
        return true;
      } else {
        setError('Invalid admin token');
        return false;
      }
    } catch (err) {
      setError('Failed to authenticate. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setError(null);
    localStorage.removeItem('admin-token');
  };

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
    error
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}