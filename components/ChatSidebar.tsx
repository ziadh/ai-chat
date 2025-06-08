"use client";

import type React from "react";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useSession } from "next-auth/react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

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
}

export const ChatSidebar = forwardRef<ChatSidebarRef, ChatSidebarProps>(
  ({ currentChatId, onChatSelect, onNewChat }, ref) => {
    const { data: session, status } = useSession();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (session?.user) {
        fetchChats();
      }
    }, [session]);

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
      setChats(prevChats => 
        prevChats.map(chat => 
          chat._id === chatId ? { ...chat, ...updates } : chat
        )
      );
    };

    useImperativeHandle(ref, () => ({
      addNewChat,
      updateChat,
      refreshChats: fetchChats,
    }));

    if (status === "loading") {
      return (
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 p-2">
            <div className="text-center text-gray-500 py-4">Loading...</div>
          </div>
        </div>
      );
    }

    if (status === "unauthenticated") {
      return null;
    }

    return (
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button onClick={onNewChat} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {loading ? (
              <div className="text-center text-gray-500 py-4">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No chats yet</div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat._id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 mb-1",
                    currentChatId === chat._id &&
                      "bg-blue-50 border border-blue-200"
                  )}
                  onClick={() => onChatSelect(chat._id)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {chat.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {chat.provider} • {chat.modelName}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                      deleteChat(chat._id, e)
                    }
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

ChatSidebar.displayName = "ChatSidebar";
