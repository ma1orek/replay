"use client";

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { AuthProvider } from "@/lib/auth/context";
import { CreditsProvider } from "@/lib/credits/context";
import { ProfileProvider } from "@/lib/profile/context";

export type PendingFlowPayload = {
  blob: Blob;
  name: string;
  context: string;
  styleDirective: string;
  createdAt: number;
};

// Serializable version for storage
type SerializedPendingFlow = {
  blobBase64: string;
  blobType: string;
  name: string;
  context: string;
  styleDirective: string;
  createdAt: number;
};

type PendingFlowContextValue = {
  pending: PendingFlowPayload | null;
  setPending: (payload: PendingFlowPayload) => void;
  clearPending: () => void;
};

const PendingFlowContext = createContext<PendingFlowContextValue | null>(null);

const STORAGE_KEY = "replay_pending_flow";
const IDB_NAME = "replay_db";
const IDB_STORE = "pending_flow";

// IndexedDB helpers for larger storage (Safari has 5MB localStorage limit)
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
  });
}

async function saveToIDB(data: SerializedPendingFlow): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const request = store.put(data, STORAGE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("IndexedDB save failed:", e);
  }
}

async function loadFromIDB(): Promise<SerializedPendingFlow | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const request = store.get(STORAGE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("IndexedDB load failed:", e);
    return null;
  }
}

async function clearFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const request = store.delete(STORAGE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("IndexedDB clear failed:", e);
  }
}

// Helper to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:video/webm;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper to convert base64 back to Blob
function base64ToBlob(base64: string, type: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}

export function PendingFlowProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPendingState] = useState<PendingFlowPayload | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from storage on mount (try IndexedDB first, then localStorage)
  useEffect(() => {
    const loadPending = async () => {
      try {
        // Try IndexedDB first (supports larger files)
        let serialized = await loadFromIDB();
        
        // Fallback to localStorage
        if (!serialized) {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            serialized = JSON.parse(stored);
          }
        }
        
        if (serialized) {
          // Check if it's not too old (max 1 hour)
          const ageMs = Date.now() - serialized.createdAt;
          if (ageMs < 60 * 60 * 1000) {
            const blob = base64ToBlob(serialized.blobBase64, serialized.blobType);
            setPendingState({
              blob,
              name: serialized.name,
              context: serialized.context,
              styleDirective: serialized.styleDirective,
              createdAt: serialized.createdAt,
            });
            console.log("[PendingFlow] Loaded pending flow:", serialized.name);
          } else {
            // Clear expired pending flow
            console.log("[PendingFlow] Clearing expired pending flow");
            localStorage.removeItem(STORAGE_KEY);
            await clearFromIDB();
          }
        }
      } catch (e) {
        console.error("[PendingFlow] Failed to load:", e);
        localStorage.removeItem(STORAGE_KEY);
        await clearFromIDB();
      }
      setIsHydrated(true);
    };
    
    loadPending();
  }, []);

  const setPending = useCallback(async (payload: PendingFlowPayload) => {
    setPendingState(payload);
    
    // Persist to storage
    try {
      const base64 = await blobToBase64(payload.blob);
      const serialized: SerializedPendingFlow = {
        blobBase64: base64,
        blobType: payload.blob.type || "video/webm",
        name: payload.name,
        context: payload.context,
        styleDirective: payload.styleDirective,
        createdAt: payload.createdAt,
      };
      
      // Try IndexedDB first (better for large files, especially on Safari)
      try {
        await saveToIDB(serialized);
        console.log("[PendingFlow] Saved to IndexedDB:", payload.name);
      } catch (idbError) {
        console.warn("[PendingFlow] IndexedDB failed, trying localStorage:", idbError);
      }
      
      // Also try localStorage as backup (may fail for large files)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
        console.log("[PendingFlow] Saved to localStorage:", payload.name);
      } catch (lsError) {
        console.warn("[PendingFlow] localStorage failed (file too large?):", lsError);
      }
    } catch (e) {
      console.error("[PendingFlow] Failed to save:", e);
    }
  }, []);

  const clearPending = useCallback(async () => {
    setPendingState(null);
    localStorage.removeItem(STORAGE_KEY);
    await clearFromIDB();
    console.log("[PendingFlow] Cleared pending flow");
  }, []);

  const value = useMemo<PendingFlowContextValue>(
    () => ({
      pending: isHydrated ? pending : null, // Don't expose pending until hydrated
      setPending,
      clearPending,
    }),
    [pending, setPending, clearPending, isHydrated]
  );

  return <PendingFlowContext.Provider value={value}>{children}</PendingFlowContext.Provider>;
}

export function usePendingFlow() {
  const ctx = useContext(PendingFlowContext);
  if (!ctx) throw new Error("usePendingFlow must be used within PendingFlowProvider");
  return ctx;
}

// Combined providers wrapper
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <CreditsProvider>
          <PendingFlowProvider>
            {children}
          </PendingFlowProvider>
        </CreditsProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
