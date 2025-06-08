"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ChatInterface } from "@/components/ChatInterface";
import { ChatSidebar } from "@/components/ChatSidebar";

export default function Home() {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleNewChat = () => {
    setCurrentChatId(undefined);
  };

  const handleChatCreated = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <SessionProvider>
      <div className="flex h-screen">
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
        <div className="flex-1">
          <ChatInterface
            chatId={currentChatId}
            onChatCreated={handleChatCreated}
          />
        </div>
      </div>
    </SessionProvider>
  );
}
