"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "text-emerald-500",
    text: "text-emerald-100",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "text-red-500",
    text: "text-red-100",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "text-blue-500",
    text: "text-blue-100",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: "text-yellow-500",
    text: "text-yellow-100",
  },
};

export function Toast({ message, type = "info", duration = 4000, onClose, isVisible }: ToastProps) {
  const Icon = icons[type];
  const color = colors[type];

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full px-4"
        >
          <div
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl",
              color.bg,
              color.border
            )}
          >
            <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", color.icon)} />
            <p className={cn("flex-1 text-sm font-medium", color.text)}>{message}</p>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing toasts
interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  return { toast, showToast, hideToast };
}

