"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SyncBar } from "./SyncBar";

const links = [
  { href: "/", label: "Meal Plan" },
  { href: "/recipes", label: "Recipes" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-sage-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-xl font-semibold text-sage-800 tracking-tight">
            Meal Prep
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-sage-100 text-sage-900"
                      : "text-sage-500 hover:text-sage-700 hover:bg-sage-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <SyncBar />
      </div>
    </nav>
  );
}
