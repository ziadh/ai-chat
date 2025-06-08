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
import { Github, Chrome } from "lucide-react";

export default function SignIn() {
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to LLM Chat</CardTitle>
          <CardDescription>
            Sign in to access your chat history and preferences
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
