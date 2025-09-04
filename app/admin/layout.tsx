import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel - Yale Ventures AI Assistant',
  description: 'Administrative interface for managing the AI assistant',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Content */}
      <main>
        {children}
      </main>
    </div>
  );
}