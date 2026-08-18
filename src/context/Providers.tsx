"use client";

import type { ReactNode } from "react";
import { AppDataProvider } from "./AppDataContext";
import { AuthGateProvider } from "./AuthGateContext";
import { ToastProvider } from "./ToastContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppDataProvider>
      <AuthGateProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthGateProvider>
    </AppDataProvider>
  );
}
