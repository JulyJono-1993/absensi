import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/page";
import ClassesPage from "@/pages/classes";
import StudentsPage from "@/pages/students";
import AttendancePage from "@/pages/attendance";
import RfidPage from "@/pages/rfid";
import ScanPage from "@/pages/scan";
import ReportsPage from "@/pages/reports";
import PrintPage from "@/pages/print";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/rfid" element={<RfidPage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/print" element={<PrintPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
