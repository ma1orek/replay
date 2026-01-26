"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, X, Send, Loader2, Sparkles, Volume2 } from "lucide-react";

interface VoiceDirectorProps {
  projectId?: string | null;
  onCommandSubmit?: (command: string) => Promise<void>;
  disabled?: boolean;
}

export default function VoiceDirector({
  projectId,
  onCommandSubmit,
  disabled = false,
}: VoiceDirectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check for Web Speech API support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onstart = () => {
      console.log("Voice recognition started");
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      console.log("Voice recognition ended");
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Voice recognition error:", event.error);
      setIsListening(false);
      
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Try again.");
      } else {
        setError(`Error: ${event.error}`);
      }
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setTranscript(prev => (prev + " " + final).trim());
      }
      setInterimTranscript(interim);
    };

    recognitionRef.current = recognition;

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

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Ignore
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleSubmit = useCallback(async () => {
    const command = transcript.trim();
    if (!command) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (onCommandSubmit) {
        await onCommandSubmit(command);
      } else {
        // Default: Send to voice command API
        const response = await fetch("/api/voice-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            command,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to submit command");
        }
      }

      // Success - clear and close
      setTranscript("");
      setInterimTranscript("");
      setIsOpen(false);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    } catch (err: any) {
      console.error("Command submit error:", err);
      setError(err.message || "Failed to submit command");
    } finally {
      setIsSubmitting(false);
    }
  }, [transcript, projectId, onCommandSubmit]);

  const handleClose = useCallback(() => {
    stopListening();
    setIsOpen(false);
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, [stopListening]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setError(null);
    // Auto-focus text input after opening
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Don't render FAB if disabled
  if (disabled) return null;

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[#FF6E3C] flex items-center justify-center shadow-xl shadow-[#FF6E3C]/25 z-40"
      >
        <Mic className="w-6 h-6 text-white" />
      </button>

      {/* Voice command modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#0a0a0a] rounded-t-3xl border-t border-white/10 p-6 pb-10 animate-in slide-in-from-bottom duration-300"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
                isListening 
                  ? "bg-red-500/20 animate-pulse" 
                  : "bg-[#FF6E3C]/20"
              }`}>
                {isListening ? (
                  <Volume2 className="w-8 h-8 text-red-400 animate-pulse" />
                ) : (
                  <Sparkles className="w-8 h-8 text-[#FF6E3C]" />
                )}
              </div>
              <h3 className="text-xl font-bold text-white">Voice Director</h3>
              <p className="text-white/50 text-sm mt-1">
                {isListening 
                  ? "Listening... speak your command" 
                  : "Tap the mic or type a command"
                }
              </p>
            </div>

            {/* Transcript display */}
            <div className="mb-4">
              <textarea
                ref={inputRef}
                value={transcript + (interimTranscript ? ` ${interimTranscript}` : "")}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setInterimTranscript("");
                }}
                placeholder='e.g., "Make the buttons blue" or "Add a header"'
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm resize-none focus:outline-none focus:border-[#FF6E3C]/50 min-h-[100px]"
                rows={4}
              />
              {interimTranscript && (
                <p className="text-[#FF6E3C]/50 text-xs mt-1 italic">
                  {interimTranscript}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Not supported warning */}
            {!isSupported && (
              <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-400 text-xs">
                  Voice input not supported in this browser. You can still type your command.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Mic button */}
              {isSupported && (
                <button
                  onClick={toggleListening}
                  disabled={isSubmitting}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    isListening
                      ? "bg-red-500 animate-pulse"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white/70" />
                  )}
                </button>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!transcript.trim() || isSubmitting}
                className="flex-1 py-4 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Command
                  </>
                )}
              </button>
            </div>

            {/* Example commands */}
            <div className="mt-6">
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">
                Try saying:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Make it darker",
                  "Add a header",
                  "Change colors to blue",
                  "Make buttons rounded",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setTranscript(example)}
                    className="px-2.5 py-1 bg-white/5 rounded-full text-white/40 text-xs hover:bg-white/10 hover:text-white/60 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
