"use client";

import { useState } from "react";
import { ChevronLeft, Check, X, CreditCard, History, Settings, LogIn } from "lucide-react";

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
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
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
  onOpenHistory,
  onOpenSettings,
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
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black">
      {/* Left - Back button ALWAYS visible */}
      <div className="w-10">
        <button 
          onClick={onBack}
          className="flex items-center justify-center text-white/60 hover:text-white p-2 -ml-2 transition-colors"
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
      
      {/* Right - Sign in button or Plan badge */}
      <div className="flex items-center relative">
        {!user ? (
          // Not logged in - show Sign in button
          <button 
            onClick={onLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6E3C] text-white text-xs font-medium active:scale-95 transition-transform"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </button>
        ) : (
          // Logged in - show plan badge with menu
          <>
            <button 
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="focus:outline-none active:scale-95 transition-transform"
            >
              {(plan === "pro" || plan === "agency" || plan === "enterprise") ? (
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white uppercase tracking-wide">
                  {getPlanDisplay()}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded text-[10px] font-medium bg-white/10 text-white/50 uppercase">
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
                  onClick={() => setShowQuickMenu(false)} 
                />
                {/* Menu */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-white/5">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Account</p>
                    <p className="text-sm text-white font-medium mt-1">{getPlanDisplay()}</p>
                    {credits !== undefined && (
                      <p className="text-xs text-white/50 mt-0.5">{credits} credits remaining</p>
                    )}
                  </div>
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        setShowQuickMenu(false);
                        // Redirect to settings with credits tab
                        window.location.href = "/settings?tab=credits";
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:bg-white/5"
                    >
                      <CreditCard className="w-4 h-4" />
                      Manage Credits
                    </button>
                    <button 
                      onClick={() => {
                        setShowQuickMenu(false);
                        // Use callback if available (no page reload), fallback to navigation
                        if (onOpenHistory) {
                          onOpenHistory();
                        } else {
                          window.location.href = "/?projects=true";
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:bg-white/5"
                    >
                      <History className="w-4 h-4" />
                      Your Projects
                    </button>
                    <button 
                      onClick={() => {
                        setShowQuickMenu(false);
                        // Redirect to settings
                        window.location.href = "/settings";
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:bg-white/5"
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
