"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const syncFromSession = useAuthStore((state) => state.syncFromSession);

  useEffect(() => {
    syncFromSession();
  }, [syncFromSession]);

  return <>{children}</>;
}
