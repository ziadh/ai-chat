"use client";

import { useSession, signOut } from "next-auth/react";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTheme } from "@/lib/theme-context";

export function ChatHeader() {
  const { data: session } = useSession();
  const { theme, toggleTheme, mounted } = useTheme();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="border-b border-border bg-background px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img 
          src="/icon.png" 
          alt="Atlas AI" 
          className="w-8 h-8 rounded-lg"
        />
        <h1 className="text-lg font-semibold">Atlas AI</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
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

        {/* User Account Menu */}
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={session.user.image || undefined} 
                    alt={session.user.name || "User"} 
                  />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={session.user.image || undefined} 
                    alt={session.user.name || "User"} 
                  />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
} 