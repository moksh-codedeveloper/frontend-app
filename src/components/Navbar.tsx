"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
type UserProfile = {
  id: number;
  email: string;
  name: string;
};

type AuthStatus = {
  status: "authenticated" | "unauthenticated";
  user?: UserProfile;
};

export function Navbar() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthStatus>({ status: "unauthenticated" });
  const [loading, setLoading] = useState(true);

  // Check auth status from backend
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/profile", {
          withCredentials: true,
        });
        setAuth({
          status: "authenticated",
          user: {
            id: response.data.id,
            email: response.data.email,
            name: response.data.name,
          },
        });
      } catch (error) {
        setAuth({ status: "unauthenticated" });
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, {
        withCredentials: true,
      });
      setAuth({ status: "unauthenticated" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 relative">
            <Image
            src="/logo.jpeg"
            alt="DFIT logo"
            fill
            className="object-cover rounded-full"
            />
          </div>
          <span className="font-bold text-gray-900 text-lg">DFIT</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-4 items-center">
          <Link href="/" passHref>
            <Button variant="ghost">Home</Button>
          </Link>
          <Link href="/" passHref>
            <Button variant="ghost">Files</Button>
          </Link>
          <Link href="/" passHref>
            <Button variant="ghost">Analytical page</Button>
          </Link>

          {!loading && auth.status === "authenticated" ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Hello, {auth.user?.name}!</span>
              <Button variant="ghost" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login" passHref>
                <Button variant="default">Login</Button>
              </Link>
              <Link href="/register" passHref>
                <Button variant="outline">Register</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px]">
              <ScrollArea className="h-full">
                <div className="flex flex-col space-y-2 mt-4">
                  <Link href="/" passHref>
                    <Button variant="ghost" className="w-full">Home</Button>
                  </Link>
                  <Link href="/dashboard" passHref>
                    <Button variant="ghost" className="w-full">Dashboard</Button>
                  </Link>

                  {!loading && auth.status === "authenticated" ? (
                    <>
                      <div className="px-4 py-2 text-gray-700 border-b border-gray-200">
                        <User className="inline h-4 w-4 mr-2" />
                        Hello, {auth.user?.name}!
                      </div>
                      <Button variant="ghost" className="w-full flex items-center space-x-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" passHref>
                        <Button variant="default" className="w-full">Login</Button>
                      </Link>
                      <Link href="/register" passHref>
                        <Button variant="outline" className="w-full">Register</Button>
                      </Link>
                    </>
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
