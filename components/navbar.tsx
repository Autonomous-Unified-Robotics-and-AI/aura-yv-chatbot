"use client";

import { YaleVenturesIcon } from "./icons";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const isAdminPage = pathname === "/admin";

  return (
    <div className="p-4 flex flex-row justify-between items-center border-b">
      <div className="flex-1" />
      
      <Link href="https://ventures.yale.edu" className="flex items-center hover:opacity-80 transition-opacity">
        <YaleVenturesIcon size={200} />
      </Link>
      
      <div className="flex-1 flex justify-end">
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
