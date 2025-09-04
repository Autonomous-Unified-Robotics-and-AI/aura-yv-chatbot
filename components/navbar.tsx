"use client";

import { YaleVenturesIcon } from "./icons";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPage = pathname.startsWith("/admin");

  const handleChatLogoClick = () => {
    // Always go to the main chat page and clear chat
    if (isAdminPage) {
      // Navigate from admin page to main chat page with clear parameter
      router.push("/?clear=true");
    } else {
      // Already on main page, navigate to home with clear parameter to trigger chat clearing
      router.push("/?clear=true");
    }
  };

  return (
    <div className="p-4 flex flex-row justify-between items-center border-b bg-blue-50">
      <button 
        onClick={handleChatLogoClick}
        className="text-2xl font-bold text-blue-800 hover:text-blue-900 transition-colors"
        title={isAdminPage ? "Go to chat and start new conversation" : "Clear conversation and start fresh"}
      >
        YVAI
      </button>
      
      <div className="flex items-center gap-4">
        {/* Powered by Yale Ventures */}
        <Link 
          href="https://ventures.yale.edu" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="mr-2">Powered by:</span>
          <YaleVenturesIcon size={80} />
        </Link>
        
        {!isAdminPage && (
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              <Settings className="h-4 w-4 mr-1" />
              Admin
            </Button>
          </Link>
        )}
        {isAdminPage && (
          <>
            <nav className="flex items-center space-x-4 mr-4">
              <Link 
                href="/admin" 
                className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/documents" 
                className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded transition-colors"
              >
                Documents
              </Link>
            </nav>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                ← Back to Chat
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
