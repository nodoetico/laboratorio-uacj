"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/lib/ThemeProvider";

const links = [
  { href: "/dashboard", label: "Inicio", icon: "📊" },
  { href: "/dashboard/experiments", label: "Experimentación", icon: "🔬" },
  { href: "/dashboard/reagents", label: "Reactivos", icon: "🧪" },
  { href: "/dashboard/equipment", label: "Equipos", icon: "⚙️" },
  { href: "/dashboard/attendance", label: "Asistencia", icon: "📋" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-1">
      {links.map((link) => {
        const active = link.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
      <div className="pt-2">
        <ThemeToggle />
      </div>
    </nav>
  );
}
