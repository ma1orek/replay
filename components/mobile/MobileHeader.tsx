"use client";

import { useState } from "react";
import { ChevronLeft, Zap, Check, X } from "lucide-react";

interface MobileHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  credits: number;
  isPro: boolean;
  plan: string;
  onBack: () => void;
  showBack?: boolean;
}

export default function MobileHeader({ 
  projectName, 
  onProjectNameChange, 
  credits, 
  isPro,
  plan,
  onBack,
  showBack = false
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
  
  // Get plan display name
  const getPlanDisplay = () => {
    if (isPro) {
      if (plan === "agency") return "Agency";
      if (plan === "enterprise") return "Enterprise";
      return "Pro";
    }
    return "Free";
  };
  
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black">
      {/* Left - Back button or spacer */}
      <div className="w-10">
        {showBack && (
          <button 
            onClick={onBack}
            className="flex items-center justify-center text-white/60 p-2 -ml-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Center - Project name */}
      <div className="flex-1 flex justify-center">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-medium focus:outline-none focus:border-[#FF6E3C] w-40 text-center"
              autoFocus
            />
            <button onClick={handleSave} className="p-1.5 rounded-lg bg-[#FF6E3C]/20 text-[#FF6E3C]">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={handleCancel} className="p-1.5 rounded-lg bg-white/10 text-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditValue(projectName);
              setIsEditing(true);
            }}
            className="text-white font-medium text-sm truncate max-w-[200px]"
          >
            {projectName}
          </button>
        )}
      </div>
      
      {/* Right - Plan badge + Credits */}
      <div className="flex items-center gap-2">
        {/* Plan badge like desktop */}
        {isPro ? (
          <span className="px-2 py-1 rounded text-[10px] font-bold bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white uppercase">
            {getPlanDisplay()}
          </span>
        ) : (
          <span className="px-2 py-1 rounded text-[10px] font-medium bg-white/10 text-white/50 uppercase">
            Free
          </span>
        )}
        
        {/* Credits */}
        <div className="flex items-center gap-1 text-white/60">
          <Zap className="w-3.5 h-3.5 text-[#FF6E3C]" />
          <span className="text-xs font-medium">{credits}</span>
        </div>
      </div>
    </header>
  );
}
