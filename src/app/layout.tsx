import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "EduAttend - Sistem Absensi Siswa",
  description: "Sistem manajemen absensi siswa harian dengan laporan via WhatsApp",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background min-h-screen font-inter antialiased overflow-x-hidden">
        <Sidebar />
        <TopBar />
        <main className="md:ml-[260px] pb-24 md:pb-8 pt-6 px-4 md:px-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
