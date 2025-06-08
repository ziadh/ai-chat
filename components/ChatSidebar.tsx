"use client";

import type React from "react";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useSession } from "next-auth/react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { TypingTitle } from "./TypingTitle";

interface Chat {
  _id: string;
  title: string;
  provider: string;
  modelName: string;
  createdAt: string;
  messages: unknown[];
}

interface ChatSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export interface ChatSidebarRef {
  addNewChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  refreshChats: () => void;
  setTitleGenerating: (chatId: string, isGenerating: boolean) => void;
}

// Skeleton loader component for better loading states
const ChatItemSkeleton = () => (
  <div className="p-3 rounded-lg mb-1 animate-pulse">
    <div className="flex items-center">
      <div className="w-4 h-4 bg-muted rounded mr-2"></div>
      <div className="flex-1">
        <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

export const ChatSidebar = forwardRef<ChatSidebarRef, ChatSidebarProps>(
  ({ currentChatId, onChatSelect, onNewChat }, ref) => {
    const { data: session, status } = useSession();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [generatingTitles, setGeneratingTitles] = useState<Set<string>>(new Set());

    // Track mounted state to prevent hydration issues
    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (session?.user) {
        fetchChats();
      } else if (status === "unauthenticated") {
        setLoading(false);
      }
    }, [session, status]);

    const fetchChats = async () => {
      try {
        const response = await fetch("/api/chats");
        if (response.ok) {
          const data = await response.json();
          setChats(data);
        }
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      } finally {
        setLoading(false);
      }
    };

    const deleteChat = async (chatId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setChats(chats.filter((chat) => chat._id !== chatId));
          if (currentChatId === chatId) {
            onNewChat();
          }
        }
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    };

    const addNewChat = (newChat: Chat) => {
      setChats(prevChats => [newChat, ...prevChats]);
    };

    const updateChat = (chatId: string, updates: Partial<Chat>) => {
      console.log('📋 ChatSidebar: Updating chat', chatId, 'with:', updates);
      setChats(prevChats => 
        prevChats.map(chat => 
          chat._id === chatId ? { ...chat, ...updates } : chat
        )
      );
    };

    const setTitleGenerating = (chatId: string, isGenerating: boolean) => {
      console.log('⚡ ChatSidebar: Setting title generating for', chatId, ':', isGenerating);
      setGeneratingTitles(prev => {
        const newSet = new Set(prev);
        if (isGenerating) {
          newSet.add(chatId);
        } else {
          newSet.delete(chatId);
        }
        return newSet;
      });
    };

    useImperativeHandle(ref, () => ({
      addNewChat,
      updateChat,
      refreshChats: fetchChats,
      setTitleGenerating,
    }));

    // Stable sidebar structure that doesn't change layout
    const renderSidebarContent = () => {
      // Show loading skeletons during initial load
      if (!mounted || status === "loading" || (status === "authenticated" && loading)) {
        return (
          <div className="p-2">
            <ChatItemSkeleton />
            <ChatItemSkeleton />
            <ChatItemSkeleton />
          </div>
        );
      }

      // Show empty state for unauthenticated users (but keep structure)
      if (status === "unauthenticated") {
        return (
          <div className="p-2">
            <div className="text-center text-muted-foreground py-8 text-sm">
              Sign in to view chats
            </div>
          </div>
        );
      }

      // Show chats or empty state
      if (chats.length === 0) {
        return (
          <div className="p-2">
            <div className="text-center text-muted-foreground py-8 text-sm">
              No chats yet
            </div>
          </div>
        );
      }

      return (
        <div className="p-2">
          {chats.map((chat) => (
            <div
              key={chat._id}
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-sidebar-accent mb-1 transition-colors duration-200",
                currentChatId === chat._id &&
                  "bg-sidebar-accent border border-sidebar-border"
              )}
              onClick={() => onChatSelect(chat._id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {generatingTitles.has(chat._id) ? (
                      <TypingTitle 
                        text={chat.title} 
                        speed={30}
                        onComplete={() => setTitleGenerating(chat._id, false)}
                      />
                    ) : (
                      chat.title
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chat.provider} • {chat.modelName}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity duration-200"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                  deleteChat(chat._id, e)
                }
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          {renderSidebarContent()}
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border flex-shrink-0">
          <Button 
            onClick={onNewChat} 
            className="w-full transition-all duration-200"
            disabled={!mounted || status !== "authenticated"}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>
    );
  }
);

ChatSidebar.displayName = "ChatSidebar";
