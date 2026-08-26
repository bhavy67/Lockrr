"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, useSignOut } from "@/features/auth/use-session";
import { initials } from "@/lib/utils";

export function UserMenu() {
  const { data: user } = useSession();
  const signOut = useSignOut();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    router.replace("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-ring flex w-full items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-accent">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {user.displayName}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {user.email}
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 h-4 w-4" /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 h-4 w-4" /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 h-4 w-4" /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
