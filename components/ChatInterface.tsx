/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "ai/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import type { ProviderKey } from "@/lib/providers";
import { ProviderSelector } from "./ProviderSelector";
import { ProviderLogo } from "./ProviderLogo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
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
  onTitleGenerating?: (chatId: string, isGenerating: boolean) => void;
}

export function ChatInterface({ chatId, onChatCreated, onChatUpdated, onTitleGenerating }: ChatInterfaceProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderKey>("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    chatId
  );
  const [hasUpdatedTitle, setHasUpdatedTitle] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatIdRef = useRef<string | undefined>(currentChatId);

  // Helper function to get user initials
  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
    setInput,
  } = useChat({
    api: "/api/chat",
    body: {
      chatId: currentChatId,
      provider,
      model,
    },
    onFinish: async (message) => {
      // Add provider info to the assistant message
      if (message.role === 'assistant') {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, provider: provider as any }
            : msg
        ));
      }
      
      // Update chat title after first AI response if not already updated
      // Use chatIdRef.current to get the most up-to-date chat ID
      const activeChatId = chatIdRef.current;
      if (activeChatId && !hasUpdatedTitle) {
        // The messages array now includes both user and assistant messages
        const allMessages = [...messages, message];
        await updateChatTitle(activeChatId, allMessages);
        setHasUpdatedTitle(true);
      }
    },
  });

  // Function to generate an AI-powered title using GPT-4o mini
  const generateAITitle = async (chatId: string, messages: any[]): Promise<string> => {
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      
      if (response.ok) {
        const { title } = await response.json();
        return title;
      } else {
        // Fallback to first message if API fails
        const firstUserMessage = messages.find((msg: any) => msg.role === 'user')?.content || '';
        return firstUserMessage.length > 50 
          ? firstUserMessage.substring(0, 47) + '...'
          : firstUserMessage || 'New Chat';
      }
    } catch (error) {
      console.error('Failed to generate AI title:', error);
      // Fallback to first message
      const firstUserMessage = messages.find((msg: any) => msg.role === 'user')?.content || '';
      return firstUserMessage.length > 50 
        ? firstUserMessage.substring(0, 47) + '...'
        : firstUserMessage || 'New Chat';
    }
  };

  // Function to update chat title
  const updateChatTitle = async (chatId: string, messages: any[]) => {
    try {
      // First, notify that we're generating a title (this stops any existing typing)
      onTitleGenerating?.(chatId, false);
      
      const newTitle = await generateAITitle(chatId, messages);
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (response.ok && onChatUpdated) {
        // Start typing animation first, then update the title data
        onTitleGenerating?.(chatId, true);
        // Update the title data immediately after (the typing animation will handle the display)
        onChatUpdated(chatId, { title: newTitle });
      }
    } catch (error) {
      console.error('Failed to update chat title:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Store the current input to send after clearing
    const messageContent = input.trim();
    
    // If no current chat ID, create chat first
    if (!currentChatId) {
      const title = "New Chat"; // Start with temporary title, AI will generate the real one
      
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
          chatIdRef.current = newChat._id; // Update ref immediately
          onChatCreated(newChat._id, newChat);
          
          // Now send the message to the chat API with the new chat ID
          append({ role: "user", content: messageContent }, {
            body: {
              chatId: newChat._id,
              provider,
              model,
            }
          });
          // Clear the input after sending
          setInput("");
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

  const loadChatMessages = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/chats/${id}`);
      if (response.ok) {
        const chat = await response.json();
        const formattedMessages = chat.messages.map((msg: any, index: number) => ({
          id: msg._id || `msg-${index}`,
          role: msg.role,
          content: msg.content,
          // Store the provider used for this message (for assistant messages)
          provider: msg.role === 'assistant' ? (msg.provider || chat.provider) : undefined,
        }));
        setMessages(formattedMessages);
        setProvider(chat.provider);
        setModel(chat.modelName);
        setHasUpdatedTitle(chat.messages.length > 0);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  }, [setMessages, setProvider, setModel, setHasUpdatedTitle]);

  useEffect(() => {
    setCurrentChatId(chatId);
    chatIdRef.current = chatId; // Update ref when chat ID changes
    setHasUpdatedTitle(false);
    if (chatId) {
      loadChatMessages(chatId);
    } else {
      setMessages([]);
    }
  }, [chatId, loadChatMessages, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to Atlas AI</h2>
          <p className="text-muted-foreground mb-4">Please sign in to start chatting</p>
          <Button onClick={() => router.push("/auth/signin")}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
      <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <div className="flex justify-center mb-4">
                <ProviderLogo provider={provider} className="w-12 h-12" />
              </div>
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
                  <ProviderLogo provider={(message as any).provider || provider} className="w-8 h-8" />
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div 
                      className="ai-response text-foreground"
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                {message.role === "user" && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={session?.user?.image || undefined} 
                      alt={session?.user?.name || "User"} 
                    />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-3">
              <ProviderLogo provider={provider} className="w-8 h-8" />
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4 space-y-3">
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
