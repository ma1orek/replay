"use client";

import { useState } from "react";
import { ChevronLeft, Zap, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  credits: number;
  isPro: boolean;
  onBack: () => void;
}

export default function MobileHeader({ 
  projectName, 
  onProjectNameChange, 
  credits, 
  isPro,
  onBack 
}: MobileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  
  const handleSave = () => {
    if (editValue.trim()) {
      onProjectNameChange(editValue.trim());
    }
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditValue(projectName);
    setIsEditing(false);
  };
  
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      {/* Left - Back button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-1 text-white/60 hover:text-white transition-colors -ml-2 p-2"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {/* Center - Project name */}
      <div className="flex-1 flex justify-center">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-medium focus:outline-none focus:border-[#FF6E3C] w-40"
                autoFocus
              />
              <button onClick={handleSave} className="p-1.5 rounded-lg bg-[#FF6E3C]/20 text-[#FF6E3C]">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={handleCancel} className="p-1.5 rounded-lg bg-white/10 text-white/60">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="display"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => {
                setEditValue(projectName);
                setIsEditing(true);
              }}
              className="text-white font-medium text-sm hover:text-white/80 transition-colors truncate max-w-[200px]"
            >
              {projectName}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      
      {/* Right - Credits/Pro badge */}
      <div className="flex items-center gap-2">
        {isPro ? (
          <span className="px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white">
            PRO
          </span>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-white/70">
            <Zap className="w-3.5 h-3.5 text-[#FF6E3C]" />
            <span className="text-xs font-medium">{credits}</span>
          </div>
        )}
      </div>
    </header>
  );
}
