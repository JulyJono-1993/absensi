"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <>
      {!isLoginPage && <Sidebar />}
      {!isLoginPage && <TopBar />}
      <main className={!isLoginPage ? "md:ml-[260px] pb-24 md:pb-8 pt-6 px-4 md:px-8" : ""}>
        {children}
      </main>
      {!isLoginPage && <BottomNav />}
    </>
  );
}
