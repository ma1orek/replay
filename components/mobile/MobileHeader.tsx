"use client";

import { useState } from "react";
import { ChevronLeft, Check, X, CreditCard, Settings, LogIn } from "lucide-react";

interface MobileHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  user: any;
  isPro: boolean;
  plan: string;
  credits?: number;
  onBack: () => void;
  onLogin?: () => void;
  onOpenCreditsModal?: () => void;
}

export default function MobileHeader({ 
  projectName, 
  onProjectNameChange, 
  user,
  isPro,
  plan,
  credits,
  onBack,
  onLogin,
  onOpenCreditsModal,
}: MobileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  
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
    if (plan === "agency") return "Agency";
    if (plan === "enterprise") return "Enterprise";
    if (plan === "pro") return "PRO";
    return "Free";
  };
  
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-[#0a0a0a]">
      {/* Left - Back button */}
      <div className="w-10">
        <button 
          onPointerUp={(e) => {
            e.preventDefault();
            onBack();
          }}
          className="flex items-center justify-center text-zinc-500 hover:text-white p-2 -ml-2 transition-colors touch-manipulation active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
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
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm font-medium focus:outline-none focus:border-zinc-600 w-40 text-center"
              autoFocus
            />
            <button 
              onPointerUp={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="p-1.5 rounded-lg bg-white text-black touch-manipulation active:scale-95"
            >
              <Check className="w-4 h-4" />
            </button>
            <button 
              onPointerUp={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 touch-manipulation active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onPointerUp={(e) => {
              e.preventDefault();
              setEditValue(projectName);
              setIsEditing(true);
            }}
            className="text-white font-medium text-sm truncate max-w-[200px] touch-manipulation"
          >
            {projectName}
          </button>
        )}
      </div>
      
      {/* Right - Sign in button or Plan badge */}
      <div className="flex items-center relative">
        {!user ? (
          // Not logged in - show Sign in button (dark style)
          <button 
            onPointerUp={(e) => {
              e.preventDefault();
              onLogin?.();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium touch-manipulation active:scale-95 transition-transform"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </button>
        ) : (
          // Logged in - show plan badge with menu
          <>
            <button 
              onPointerUp={(e) => {
                e.preventDefault();
                setShowQuickMenu(!showQuickMenu);
              }}
              className="focus:outline-none touch-manipulation active:scale-95 transition-transform"
            >
              {(plan === "pro" || plan === "agency" || plan === "enterprise") ? (
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-white text-black uppercase tracking-wide">
                  {getPlanDisplay()}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 uppercase">
                  {getPlanDisplay()}
                </span>
              )}
            </button>
            
            {/* Quick menu dropdown */}
            {showQuickMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onPointerUp={() => setShowQuickMenu(false)} 
                />
                {/* Menu */}
                <div className="absolute top-full right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Account</p>
                    <p className="text-sm text-white font-medium mt-1">{getPlanDisplay()}</p>
                    {credits !== undefined && (
                      <p className="text-xs text-zinc-500 mt-0.5">{credits} credits remaining</p>
                    )}
                  </div>
                  <div className="py-1">
                    <button 
                      onPointerUp={(e) => {
                        e.preventDefault();
                        setShowQuickMenu(false);
                        window.location.href = "/settings?tab=credits";
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 touch-manipulation"
                    >
                      <CreditCard className="w-4 h-4" />
                      Manage Credits
                    </button>
                    <button 
                      onPointerUp={(e) => {
                        e.preventDefault();
                        setShowQuickMenu(false);
                        window.location.href = "/settings";
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 touch-manipulation"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
}
