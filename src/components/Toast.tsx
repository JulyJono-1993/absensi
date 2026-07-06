"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  description?: string;
  type?: "success" | "error" | "info";
  show: boolean;
  onClose: () => void;
}

export function Toast({ message, description, type = "success", show, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !visible) return null;

  const colors = {
    success: "border-emerald-500 text-emerald-600",
    error: "border-red-500 text-red-600",
    info: "border-blue-500 text-blue-600",
  };

  const icons = {
    success: "check_circle",
    error: "error",
    info: "info",
  };

  return (
    <div
      className={`fixed bottom-24 right-4 md:right-8 bg-surface-container-highest border-l-4 ${colors[type]} p-4 rounded-lg shadow-xl z-[100] flex items-center gap-3 ${visible ? "toast-enter" : "toast-exit"}`}
    >
      <div className={`w-8 h-8 rounded-full bg-current/20 flex items-center justify-center ${colors[type]}`}>
        <span className="material-symbols-outlined">{icons[type]}</span>
      </div>
      <div>
        <p className="font-semibold text-sm text-on-surface">{message}</p>
        {description && <p className="text-[10px] text-on-surface-variant">{description}</p>}
      </div>
    </div>
  );
}
