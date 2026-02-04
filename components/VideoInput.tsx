"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Monitor, 
  Mic, 
  MicOff, 
  Square, 
  Pause, 
  Play,
  RotateCcw,
  Upload,
  Check,
  X
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

interface VideoInputProps {
  onVideoReady: (videoBlob: Blob, audioBlob?: Blob) => void;
  onRecordingStart?: () => void;
}

type InputMode = "idle" | "recording" | "preview";

// Check supported mimeTypes
function getSupportedMimeType(): string {
  const types = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}

export default function VideoInput({ 
  onVideoReady, 
  onRecordingStart 
}: VideoInputProps) {
  const [mode, setMode] = useState<InputMode>("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasAudio, setHasAudio] = useState(true);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      cleanupStreams();
    };
  }, [previewUrl]);

  const cleanupStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ==================== SCREEN RECORDING ====================
  const startRecording = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false, // Disable audio from display to avoid echo
      });
      
      streamRef.current = screenStream;
      videoChunksRef.current = [];
      
      const mimeType = getSupportedMimeType();
      console.log("Using mimeType:", mimeType);
      
      const mediaRecorder = new MediaRecorder(screenStream, { mimeType });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: mimeType });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setMode("preview");
        cleanupStreams();
      };
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Microphone for narration
      if (hasAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          
          audioStreamRef.current = audioStream;
          audioChunksRef.current = [];
          
          const audioRecorder = new MediaRecorder(audioStream, {
            mimeType: "audio/webm",
          });
          
          audioRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          
          audioRecorderRef.current = audioRecorder;
          audioRecorder.start(1000);
        } catch (audioErr) {
          console.warn("Could not access microphone:", audioErr);
          setHasAudio(false);
        }
      }
      
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
      
      mediaRecorder.start(1000);
      setMode("recording");
      setDuration(0);
      onRecordingStart?.();
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording. Please try again.");
    }
  }, [hasAudio, onRecordingStart]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioRecorderRef.current && audioRecorderRef.current.state !== "inactive") {
      audioRecorderRef.current.stop();
    }
    cleanupStreams();
    setIsPaused(false);
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        audioRecorderRef.current?.resume();
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        audioRecorderRef.current?.pause();
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  }, [isPaused]);

  // ==================== FILE UPLOAD ====================
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }
    
    setVideoBlob(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMode("preview");
    
    const video = document.createElement("video");
    video.src = url;
    video.onloadedmetadata = () => {
      setDuration(Math.floor(video.duration));
    };
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // ==================== ACTIONS ====================
  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideoBlob(null);
    setPreviewUrl(null);
    setMode("idle");
    setDuration(0);
    videoChunksRef.current = [];
    audioChunksRef.current = [];
  }, [previewUrl]);

  const confirmVideo = useCallback(() => {
    if (videoBlob) {
      const audioBlob = audioChunksRef.current.length > 0 
        ? new Blob(audioChunksRef.current, { type: "audio/webm" })
        : undefined;
      onVideoReady(videoBlob, audioBlob);
    }
  }, [videoBlob, onVideoReady]);

  return (
    <div className="flex flex-col h-full">
      <div 
        className={cn(
          "flex-1 relative bg-surface-1 rounded-xl overflow-hidden border transition-all",
          isDragOver ? "border-accent-primary border-2 bg-accent-glow" : "border-border-subtle"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {mode === "preview" && previewUrl && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={previewUrl}
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              loop
            />
            <button
              onClick={reset}
              className="absolute top-3 right-3 p-2 bg-surface-0/80 hover:bg-surface-0 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === "recording" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-32 h-32 rounded-2xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center relative"
            >
              <Monitor className="w-12 h-12 text-red-400" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </motion.div>
            
            <p className="mt-6 text-text-secondary text-sm">Recording...</p>
            
            <div className="mt-4 px-4 py-2 bg-surface-3 rounded-lg border border-border-subtle">
              <span className="font-mono text-lg text-text-primary">
                {formatDuration(duration)}
              </span>
            </div>
          </div>
        )}

        {mode === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            {isDragOver ? (
              <div className="text-center">
                <Upload className="w-16 h-16 text-accent-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-accent-primary">Drop video here</p>
              </div>
            ) : (
              <>
                <div className="flex gap-6 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startRecording}
                    className="flex flex-col items-center gap-3 p-6 bg-surface-2 hover:bg-surface-3 rounded-2xl border border-border-subtle transition-colors"
                  >
                    <div className="w-16 h-16 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Monitor className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-text-primary">Record Screen</p>
                      <p className="text-xs text-text-muted mt-1">Capture live</p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-3 p-6 bg-surface-2 hover:bg-surface-3 rounded-2xl border border-border-subtle transition-colors"
                  >
                    <div className="w-16 h-16 rounded-xl bg-accent-glow flex items-center justify-center">
                      <Upload className="w-8 h-8 text-accent-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-text-primary">Upload Video</p>
                      <p className="text-xs text-text-muted mt-1">MP4, WebM</p>
                    </div>
                  </motion.button>
                </div>

                <p className="text-sm text-text-muted">or drag & drop</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="w-28">
          {mode === "idle" && (
            <button
              onClick={() => setHasAudio(!hasAudio)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                hasAudio ? "bg-accent-glow text-accent-primary" : "bg-surface-3 text-text-secondary"
              )}
            >
              {hasAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span className="text-sm font-medium">{hasAudio ? "Mic On" : "Mic Off"}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mode === "recording" && (
            <>
              <button onClick={pauseRecording} className="p-3 bg-surface-3 hover:bg-surface-4 rounded-xl border border-border-subtle">
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button onClick={stopRecording} className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium">
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </button>
            </>
          )}

          {mode === "preview" && (
            <>
              <button onClick={reset} className="p-3 bg-surface-3 hover:bg-surface-4 rounded-xl border border-border-subtle">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={confirmVideo}
                className="flex items-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-secondary text-white rounded-xl font-medium shadow-lg"
              >
                <Check className="w-5 h-5" />
                <span>Use Video</span>
              </button>
            </>
          )}
        </div>

        <div className="w-28 text-right">
          {(mode === "recording" || mode === "preview") && (
            <span className="font-mono text-text-secondary">{formatDuration(duration)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
