"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Mic, MicOff } from "lucide-react";

interface CommentBubbleProps {
  position: { x: number; y: number };
  onSubmit: (text: string) => void;
  onClose: () => void;
  authorName?: string;
  authorAvatar?: string;
}

export default function CommentBubble({
  position,
  onSubmit,
  onClose,
  authorName = "You",
  authorAvatar,
}: CommentBubbleProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = navigator.language || "en-US";

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setText(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onerror = () => {
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Calculate position to keep bubble on screen
  const bubbleStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.min(position.x, window.innerWidth - 280),
    top: Math.min(position.y + 20, window.innerHeight - 200),
    zIndex: 100,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99]"
        onClick={onClose}
      />

      {/* Pin marker at touch point */}
      <div
        className="fixed w-4 h-4 -ml-2 -mt-2 z-[100]"
        style={{ left: position.x, top: position.y }}
      >
        <div className="w-4 h-4 rounded-full bg-[#FF6E3C] border-2 border-white shadow-lg animate-ping absolute" />
        <div className="w-4 h-4 rounded-full bg-[#FF6E3C] border-2 border-white shadow-lg relative" />
      </div>

      {/* Comment bubble */}
      <div
        style={bubbleStyle}
        className="w-[260px] bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#FF6E3C]/20 flex items-center justify-center">
                <span className="text-xs text-[#FF6E3C] font-medium">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-white/70">{authorName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Input area */}
        <div className="p-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-[#FF6E3C]/50"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Voice input */}
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording
                ? "bg-red-500/20 text-red-400"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              text.trim()
                ? "bg-[#FF6E3C] text-white"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </>
  );
}
