"use client";

import { use } from "react";
import { SessionProvider } from "next-auth/react";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/lib/theme-context";

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { chatId } = use(params);
  
  return (
    <SessionProvider>
      <ThemeProvider>
        <AppLayout chatId={chatId} />
      </ThemeProvider>
    </SessionProvider>
  );
} 