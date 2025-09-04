"use client";

import { useAdminAuth } from '@/contexts/admin-auth';

export function useAdminApi() {
  const { token, logout } = useAdminAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401, logout the user
    if (response.status === 401) {
      logout();
      throw new Error('Authentication expired. Please sign in again.');
    }

    return response;
  };

  return {
    authenticatedFetch,
    isAuthenticated: !!token,
  };
}