"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Utensils } from "lucide-react";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";

export default function Header() {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    // In a real app we'd also call an API to clear the cookie
    // For now, clear client state and redirect
    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    logout();
    router.push("/");
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 w-full border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-headline text-2xl font-bold text-accent">
            GourmetHub
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
