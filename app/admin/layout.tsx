"use client";

import { AdminAuthProvider, useAdminAuth } from '@/contexts/admin-auth';
import { AdminSignIn } from '@/components/admin-signin';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login, logout, error } = useAdminAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <AdminSignIn onSignIn={login} error={error || undefined} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Admin Content */}
      <main>
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminContent>
        {children}
      </AdminContent>
    </AdminAuthProvider>
  );
}