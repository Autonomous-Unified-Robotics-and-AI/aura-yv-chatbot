"use client";

import React, { useState, useEffect } from 'react';
import { AdminSignIn } from '@/components/admin-signin';
import { AdminDashboard } from '@/components/admin-dashboard';

export default function AdminPage() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('yale-ventures-admin-token');
    if (savedToken) {
      setToken(savedToken);
      setIsSignedIn(true);
    }
  }, []);

  const handleSignIn = async (inputToken: string) => {
    setError('');
    
    // Verify token by making a test API call
    const backendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '';
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${inputToken}` }
      });
      
      if (response.ok) {
        setToken(inputToken);
        setIsSignedIn(true);
        localStorage.setItem('yale-ventures-admin-token', inputToken);
      } else if (response.status === 401) {
        setError('Invalid admin token. Please check your credentials.');
      } else {
        setError('Unable to connect to the server. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    }
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setToken('');
    setError('');
    localStorage.removeItem('yale-ventures-admin-token');
  };

  if (!isSignedIn) {
    return <AdminSignIn onSignIn={handleSignIn} error={error} />;
  }

  return <AdminDashboard token={token} onSignOut={handleSignOut} />;
}