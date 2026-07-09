import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <TopBar />
      <main className="md:ml-[260px] pb-24 md:pb-8 pt-6 px-4 md:px-8">
        {children}
      </main>
      <BottomNav />
      <footer className="md:ml-[260px] px-4 md:px-8 py-4 text-center border-t border-outline-variant">
        <p className="text-xs text-on-surface-variant">
          Built with ❤️ by JulyJono using Vibe Coding
        </p>
      </footer>
    </>
  );
}
