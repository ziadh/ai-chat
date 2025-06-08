"use client";

import { useState, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { ChatInterface } from "@/components/ChatInterface";
import { ChatSidebar, type ChatSidebarRef } from "@/components/ChatSidebar";
import { ChatHeader } from "@/components/ChatHeader";
import { ThemeProvider } from "@/lib/theme-context";

interface Chat {
  _id: string;
  title: string;
  provider: string;
  modelName: string;
  createdAt: string;
  messages: unknown[];
}

function AppContent() {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const sidebarRef = useRef<ChatSidebarRef>(null);
  const { status } = useSession();

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

  // Show a minimal loading state during session check to prevent flash
  if (status === "loading") {
    return (
      <div className="flex h-screen flex-col">
        <div className="border-b border-border bg-background px-4 py-2 h-[52px]">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg animate-pulse"></div>
              <div className="w-20 h-5 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex flex-1">
          <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="flex-1 p-2">
              <div className="p-3 rounded-lg mb-1 animate-pulse">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-muted rounded mr-2"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-sidebar-border">
              <div className="w-full h-9 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-muted border-t-muted-foreground rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <ChatHeader />
      <div className="flex flex-1">
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
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SessionProvider>
  );
}
