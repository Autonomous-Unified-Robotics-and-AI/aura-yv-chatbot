"use client";

import { YaleVenturesIcon } from "./icons";
import Link from "next/link";

export const Navbar = () => {
  return (
    <div className="p-4 flex flex-row justify-center border-b">
      <Link href="https://ventures.yale.edu" className="flex items-center hover:opacity-80 transition-opacity">
        <YaleVenturesIcon size={32} />
        <span className="text-xl font-bold text-primary ml-2">Yale Ventures</span>
      </Link>
    </div>
  );
};
