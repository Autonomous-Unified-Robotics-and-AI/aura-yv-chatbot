"use client";

import { useAdminAuth } from '@/contexts/admin-auth';

export function useAdminApi() {
  const { token, logout } = useAdminAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    console.log('🔗 Making authenticated request to:', url);
    
    if (!token) {
      console.error('❌ No authentication token available');
      throw new Error('No authentication token available');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log('📤 Request headers:', { ...headers, 'Authorization': 'Bearer [REDACTED]' });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`📥 Response status: ${response.status} ${response.statusText} for ${url}`);

      // If we get a 401, logout the user
      if (response.status === 401) {
        console.error('🚫 Authentication expired - logging out user');
        logout();
        throw new Error('Authentication expired. Please sign in again.');
      }

      if (!response.ok) {
        console.error(`❌ Request failed: ${response.status} ${response.statusText} for ${url}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('💥 Fetch error for', url, ':', error);
      throw error;
    }
  };

  return {
    authenticatedFetch,
    isAuthenticated: !!token,
  };
}