/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "ai/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Send, User, Bot } from "lucide-react";
import type { ProviderKey } from "@/lib/providers";
import { ProviderSelector } from "./ProviderSelector";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";

interface Chat {
  _id: string;
  title: string;
  provider: string;
  modelName: string;
  createdAt: string;
  messages: unknown[];
}

interface ChatInterfaceProps {
  chatId?: string;
  onChatCreated: (chatId: string, chatData?: Chat) => void;
  onChatUpdated?: (chatId: string, updates: Partial<Chat>) => void;
}

export function ChatInterface({ chatId, onChatCreated, onChatUpdated }: ChatInterfaceProps) {
  const { status } = useSession();
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderKey>("openai");
  const [model, setModel] = useState("gpt-4o");
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    chatId
  );
  const [hasUpdatedTitle, setHasUpdatedTitle] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
  } = useChat({
    api: "/api/chat",
    body: {
      chatId: currentChatId,
      provider,
      model,
    },
    onFinish: async () => {
      // Update chat title after first AI response if not already updated
      if (currentChatId && !hasUpdatedTitle && messages.length >= 1) {
        await updateChatTitle(currentChatId, messages[0]?.content || input);
        setHasUpdatedTitle(true);
      }
    },
  });

  // Function to generate a better title based on the first message
  const generateTitle = (firstMessage: string): string => {
    // Remove extra whitespace and truncate
    const cleaned = firstMessage.trim();
    
    // If it's a question, use as is (up to 50 chars)
    if (cleaned.includes('?')) {
      return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
    }
    
    // If it's a command/request, make it more descriptive
    const lowerCased = cleaned.toLowerCase();
    if (lowerCased.startsWith('write') || lowerCased.startsWith('create') || lowerCased.startsWith('generate')) {
      return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
    }
    
    // For other types, try to extract the main topic
    const words = cleaned.split(' ');
    if (words.length > 8) {
      return words.slice(0, 8).join(' ') + '...';
    }
    
    return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
  };

  // Function to update chat title
  const updateChatTitle = async (chatId: string, firstMessage: string) => {
    try {
      const newTitle = generateTitle(firstMessage);
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (response.ok && onChatUpdated) {
        onChatUpdated(chatId, { title: newTitle });
      }
    } catch (error) {
      console.error('Failed to update chat title:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // If no current chat ID, create chat first
    if (!currentChatId) {
      const title = input.slice(0, 50) + (input.length > 50 ? "..." : "");
      
      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title, 
            provider, 
            modelName: model 
          }),
        });
        if (response.ok) {
          const newChat = await response.json();
          setCurrentChatId(newChat._id);
          onChatCreated(newChat._id, newChat);
          
          // Now send the message to the chat API with the new chat ID
          append({ role: "user", content: input }, {
            body: {
              chatId: newChat._id,
              provider,
              model,
            }
          });
          return;
        }
      } catch (error) {
        console.error("Failed to create chat:", error);
        return;
      }
    }
    
    // For existing chats, use normal submit
    handleSubmit(e);
  };

  useEffect(() => {
    if (chatId !== currentChatId) {
      setCurrentChatId(chatId);
      setHasUpdatedTitle(false);
      if (chatId) {
        loadChatMessages(chatId);
      } else {
        setMessages([]);
      }
    }
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatMessages = async (id: string) => {
    try {
      const response = await fetch(`/api/chats/${id}`);
      if (response.ok) {
        const chat = await response.json();
        const formattedMessages = chat.messages.map((msg: any, index: number) => ({
          id: msg._id || `msg-${index}`,
          role: msg.role,
          content: msg.content,
        }));
        setMessages(formattedMessages);
        setProvider(chat.provider);
        setModel(chat.modelName);
        setHasUpdatedTitle(chat.messages.length > 0);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to LLM Chat</h2>
          <p className="text-gray-600 mb-4">Please sign in to start chatting</p>
          <Button onClick={() => router.push("/auth/signin")}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Start a conversation with your AI assistant</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || `message-${index}`}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-gray-200 p-4 space-y-3">
        <ProviderSelector
          provider={provider}
          model={model}
          onProviderChange={setProvider}
          onModelChange={setModel}
        />
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
