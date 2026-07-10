import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "@/lib/auth";

const navItems = [
  { href: "/", icon: "dashboard", label: "Home" },
  { href: "/classes", icon: "school", label: "Kelas" },
  { href: "/students", icon: "person", label: "Siswa" },
  { href: "/attendance", icon: "edit_note", label: "Absen" },
  { href: "/rfid", icon: "search", label: "RFID" },
  { href: "/scan", icon: "scan", label: "Scan" },
  { href: "/reports", icon: "assessment", label: "Laporan" },
  { href: "/print", icon: "print", label: "Cetak" },
  { href: "/backup", icon: "backup", label: "Backup" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-2 pt-1 z-50 md:hidden bg-surface border-t border-outline-variant shadow-lg">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={
              isActive
                ? "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-xl px-3 py-1"
                : "flex flex-col items-center justify-center text-on-surface-variant py-2 px-1"
            }
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
      <button onClick={handleLogout} className="flex flex-col items-center justify-center text-on-surface-variant py-2 px-1">
        <span className="material-symbols-outlined text-xl">logout</span>
        <span className="text-[10px] font-medium">Keluar</span>
      </button>
    </nav>
  );
}
