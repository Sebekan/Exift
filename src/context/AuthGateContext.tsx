"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type SoftGateReason = "like" | "comment" | "save" | "contact";

interface AuthGateContextValue {
  /** Small dismissible top bar used for in-place actions (like/comment/save) —
   * a soft nudge, not a blocking full-screen requirement. */
  softGateReason: SoftGateReason | null;
  requestSoftGate: (reason: SoftGateReason) => void;
  dismissSoftGate: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const [softGateReason, setSoftGateReason] = useState<SoftGateReason | null>(null);

  function requestSoftGate(reason: SoftGateReason) {
    setSoftGateReason(reason);
  }

  function dismissSoftGate() {
    setSoftGateReason(null);
  }

  return (
    <AuthGateContext.Provider value={{ softGateReason, requestSoftGate, dismissSoftGate }}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used within AuthGateProvider");
  return ctx;
}
