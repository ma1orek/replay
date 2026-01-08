"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
    bg: "bg-[#0a0a0a]",
    border: "border-white/10",
    icon: "text-emerald-400",
    text: "text-white/70",
  },
  error: {
    bg: "bg-[#0a0a0a]",
    border: "border-white/10",
    icon: "text-red-400",
    text: "text-white/70",
  },
  info: {
    bg: "bg-[#0a0a0a]",
    border: "border-white/10",
    icon: "text-blue-400",
    text: "text-white/70",
  },
  warning: {
    bg: "bg-[#0a0a0a]",
    border: "border-white/10",
    icon: "text-yellow-400",
    text: "text-white/70",
  },
};

export function Toast({ message, type = "info", duration = 3000, onClose, isVisible }: ToastProps) {
  const Icon = icons[type];
  const color = colors[type];
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onCloseRef.current();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, message]); // message change resets timer

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-4 left-0 right-0 z-[100] flex justify-center px-4"
        >
          <div
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-lg border backdrop-blur-xl shadow-xl max-w-sm w-full",
              color.bg,
              color.border
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0 self-start mt-0.5", color.icon)} />
            <p className={cn("flex-1 text-xs break-words whitespace-pre-line", color.text)}>{message}</p>
            <button
              onClick={onClose}
              className="p-0.5 rounded hover:bg-white/5 transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5 text-white/40" />
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

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
}


