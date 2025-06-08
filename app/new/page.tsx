"use client";

import { SessionProvider } from "next-auth/react";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/lib/theme-context";

export default function NewChatPage() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </SessionProvider>  
  );
} 