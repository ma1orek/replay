"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { AuthProvider } from "@/lib/auth/context";
import { CreditsProvider } from "@/lib/credits/context";

export type PendingFlowPayload = {
  blob: Blob;
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

export function PendingFlowProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPendingState] = useState<PendingFlowPayload | null>(null);

  const value = useMemo<PendingFlowContextValue>(
    () => ({
      pending,
      setPending: (payload) => setPendingState(payload),
      clearPending: () => setPendingState(null),
    }),
    [pending]
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
      <CreditsProvider>
        <PendingFlowProvider>
          {children}
        </PendingFlowProvider>
      </CreditsProvider>
    </AuthProvider>
  );
}



