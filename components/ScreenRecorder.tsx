"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, 
  Mic, 
  MicOff, 
  Circle, 
  Square, 
  Pause, 
  Play,
  RotateCcw,
  Download,
  Check
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

interface ScreenRecorderProps {
  onRecordingComplete: (videoBlob: Blob, audioBlob?: Blob) => void;
  onRecordingStart?: () => void;
}

export default function ScreenRecorder({ 
  onRecordingComplete, 
  onRecordingStart 
}: ScreenRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasAudio, setHasAudio] = useState(true);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [previewUrl]);

  const startRecording = useCallback(async () => {
    try {
      // Get screen stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });
      
      streamRef.current = screenStream;
      videoChunksRef.current = [];
      
      // Setup video recorder
      const mediaRecorder = new MediaRecorder(screenStream, {
        mimeType: "video/webm;codecs=vp9",
      });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });
        setRecordedVideo(videoBlob);
        const url = URL.createObjectURL(videoBlob);
        setPreviewUrl(url);
        setIsReady(true);
        
        // Clean up streams
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Get audio stream if enabled
      if (hasAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
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
          audioRecorder.start(100);
        } catch (audioErr) {
          console.warn("Could not access microphone:", audioErr);
          setHasAudio(false);
        }
      }
      
      // Handle stream end (user clicks "Stop Sharing")
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      onRecordingStart?.();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  }, [hasAudio, onRecordingStart]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioRecorderRef.current && audioRecorderRef.current.state !== "inactive") {
      audioRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
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

  const resetRecording = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedVideo(null);
    setPreviewUrl(null);
    setIsReady(false);
    setDuration(0);
    videoChunksRef.current = [];
    audioChunksRef.current = [];
  }, [previewUrl]);

  const confirmRecording = useCallback(() => {
    if (recordedVideo) {
      const audioBlob = audioChunksRef.current.length > 0 
        ? new Blob(audioChunksRef.current, { type: "audio/webm" })
        : undefined;
      onRecordingComplete(recordedVideo, audioBlob);
    }
  }, [recordedVideo, onRecordingComplete]);

  return (
    <div className="flex flex-col h-full">
      {/* Preview Area */}
      <div className="flex-1 relative bg-surface-1 rounded-xl overflow-hidden border border-border-subtle">
        {previewUrl ? (
          <video
            ref={videoRef}
            src={previewUrl}
            className="w-full h-full object-contain bg-black"
            controls
            autoPlay
            loop
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative">
              <motion.div
                animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={cn(
                  "w-32 h-32 rounded-2xl flex items-center justify-center",
                  isRecording 
                    ? "bg-red-500/20 border-2 border-red-500" 
                    : "bg-surface-3 border border-border-default"
                )}
              >
                <Monitor className={cn(
                  "w-12 h-12",
                  isRecording ? "text-red-400" : "text-text-secondary"
                )} />
              </motion.div>
              
              {isRecording && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-recording" />
                </motion.div>
              )}
            </div>
            
            <p className="mt-6 text-text-secondary text-sm">
              {isRecording 
                ? "Recording your screen..." 
                : "Click to start recording your screen"}
            </p>
            
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 px-4 py-2 bg-surface-3 rounded-lg border border-border-subtle"
              >
                <span className="font-mono text-lg text-text-primary">
                  {formatDuration(duration)}
                </span>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        {/* Audio Toggle */}
        <button
          onClick={() => setHasAudio(!hasAudio)}
          disabled={isRecording}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
            hasAudio 
              ? "bg-accent-glow text-accent-primary" 
              : "bg-surface-3 text-text-secondary",
            isRecording && "opacity-50 cursor-not-allowed"
          )}
        >
          {hasAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {hasAudio ? "Mic On" : "Mic Off"}
          </span>
        </button>

        {/* Main Controls */}
        <div className="flex items-center gap-2">
          {!isRecording && !isReady && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/20"
            >
              <Circle className="w-5 h-5 fill-current" />
              <span>Start Recording</span>
            </motion.button>
          )}

          {isRecording && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={pauseRecording}
                className="p-3 bg-surface-3 hover:bg-surface-4 rounded-xl border border-border-subtle"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-surface-3 hover:bg-surface-4 text-text-primary rounded-xl font-medium border border-border-subtle"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </motion.button>
            </>
          )}

          {isReady && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetRecording}
                className="p-3 bg-surface-3 hover:bg-surface-4 rounded-xl border border-border-subtle"
                title="Record again"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmRecording}
                className="flex items-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-secondary text-white rounded-xl font-medium shadow-lg shadow-accent-primary/20"
              >
                <Check className="w-5 h-5" />
                <span>Use Recording</span>
              </motion.button>
            </>
          )}
        </div>

        {/* Duration Display */}
        <div className="w-24 text-right">
          {(isRecording || isReady) && (
            <span className="font-mono text-text-secondary">
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}



