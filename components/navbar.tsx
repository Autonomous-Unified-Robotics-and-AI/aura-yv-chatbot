"use client";

import { YaleVenturesIcon } from "./icons";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPage = pathname === "/admin";

  const handleChatLogoClick = () => {
    // Always go to the chatbot page and clear chat
    if (isAdminPage) {
      // Navigate from admin page to main chat page and clear
      router.push("/?clear=true");
    } else {
      // Already on main page, just clear chat by reloading
      window.location.reload();
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
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              ← Back to Chat
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
