/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, Chrome, Moon, Sun } from "lucide-react";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      disabled={!mounted}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

function SignInContent() {
  const [providers, setProviders] = useState<any>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case "github":
        return <Github className="w-5 h-5" />;
      case "google":
        return <Chrome className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
      {/* Header with branding and theme toggle */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/icon.png" 
            alt="Atlas AI" 
            className="w-8 h-8 rounded-lg"
          />
          <h1 className="text-lg font-semibold">Atlas AI</h1>
        </div>
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/icon.png" 
              alt="Atlas AI" 
              className="w-16 h-16 rounded-xl"
            />
          </div>
          <CardTitle>Welcome to Atlas AI</CardTitle>
          <CardDescription>
            Sign in to access your intelligent AI conversations and chat history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers &&
            Object.values(providers).map((provider: any) => (
              <Button
                key={provider.name}
                variant="outline"
                className="w-full"
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
              >
                {getProviderIcon(provider.id)}
                <span className="ml-2">Continue with {provider.name}</span>
              </Button>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignIn() {
  return (
    <ThemeProvider>
      <SignInContent />
    </ThemeProvider>
  );
}
