"use client";

import React from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  // Authentication disabled – always render children
  return <>{children}</>;
}
