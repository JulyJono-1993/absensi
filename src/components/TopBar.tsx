"use client";

export function TopBar() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-outline-variant flex justify-between items-center w-full px-4 md:px-8 h-16 md:ml-[260px] md:w-[calc(100%-260px)]">
      <div className="flex items-center gap-4">
        <span className="font-bold text-xl text-primary md:hidden">EduAttend</span>
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-64"
            placeholder="Cari siswa atau kelas..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="hover:bg-surface-container-low rounded-full p-2 transition-all">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
        <button className="hover:bg-surface-container-low rounded-full p-2 transition-all">
          <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
        </button>
        <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-sm text-on-surface">Admin</p>
            <p className="text-[10px] text-on-surface-variant">Petugas Absensi</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
            A
          </div>
          <button onClick={handleLogout} className="hidden sm:flex items-center gap-1 text-xs text-error hover:bg-error/5 px-3 py-2 rounded-lg transition-colors ml-2">
            <span className="material-symbols-outlined text-sm">logout</span>
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
