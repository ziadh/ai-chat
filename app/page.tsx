"use client";

import { useState, useRef } from "react";
import { SessionProvider } from "next-auth/react";
import { ChatInterface } from "@/components/ChatInterface";
import { ChatSidebar, type ChatSidebarRef } from "@/components/ChatSidebar";

interface Chat {
  _id: string;
  title: string;
  provider: string;
  modelName: string;
  createdAt: string;
  messages: unknown[];
}

export default function Home() {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const sidebarRef = useRef<ChatSidebarRef>(null);

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleNewChat = () => {
    setCurrentChatId(undefined);
  };

  const handleChatCreated = (chatId: string, chatData?: Chat) => {
    setCurrentChatId(chatId);
    
    // Add the new chat to the sidebar immediately
    if (chatData && sidebarRef.current) {
      sidebarRef.current.addNewChat(chatData);
    }
  };

  const handleChatUpdated = (chatId: string, updates: Partial<Chat>) => {
    // Update chat in sidebar
    if (sidebarRef.current) {
      sidebarRef.current.updateChat(chatId, updates);
    }
  };

  return (
    <SessionProvider>
      <div className="flex h-screen">
        <ChatSidebar
          ref={sidebarRef}
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
        <div className="flex-1">
          <ChatInterface
            chatId={currentChatId}
            onChatCreated={handleChatCreated}
            onChatUpdated={handleChatUpdated}
          />
        </div>
      </div>
    </SessionProvider>
  );
}
