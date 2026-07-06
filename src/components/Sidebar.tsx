"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/browser-client";

const navItems = [
  { href: "/", icon: "dashboard", label: "Dashboard" },
  { href: "/classes", icon: "school", label: "Master Kelas" },
  { href: "/students", icon: "person", label: "Master Siswa" },
  { href: "/attendance", icon: "edit_note", label: "Entri Absensi" },
  { href: "/reports", icon: "assessment", label: "Laporan" },
  { href: "/print", icon: "print", label: "Cetak" },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] hidden md:flex flex-col bg-primary shadow-sm z-50 py-6">
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-on-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-2xl">school</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-on-primary leading-none">EduAttend</h1>
          <p className="text-[10px] text-on-primary/70 uppercase tracking-widest mt-1">
            Admin Management
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "bg-primary-container text-on-primary-container font-bold rounded-lg mx-2 px-4 py-3 flex items-center gap-3"
                  : "text-secondary-fixed-dim hover:text-on-primary px-4 py-3 mx-2 transition-colors flex items-center gap-3 rounded-lg hover:bg-on-primary/5"
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pt-6 mt-6 border-t border-on-primary/10">
        <button onClick={handleLogout} className="text-secondary-fixed-dim hover:text-on-primary px-4 py-3 mx-2 transition-colors flex items-center gap-3 rounded-lg hover:bg-on-primary/5 w-full">
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
