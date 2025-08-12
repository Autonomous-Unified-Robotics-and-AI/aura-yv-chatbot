"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';

interface AdminSignInProps {
  onSignIn: (token: string) => void;
  error?: string;
}

export function AdminSignIn({ onSignIn, error }: AdminSignInProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    
    setIsLoading(true);
    try {
      await onSignIn(token.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Yale Ventures Admin
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access user data and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Admin Password</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter admin password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !token.trim()}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>Authorized personnel only</p>
            <p>Contact Yale Ventures for access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}