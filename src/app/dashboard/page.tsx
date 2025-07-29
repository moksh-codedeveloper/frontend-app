/* eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
// Import simple icons instead of complex ones or images
import { UserCircleIcon, CloudArrowUpIcon, DocumentTextIcon, ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';
// import { Button } from "@/components/ui/button";
// Assuming these are properly imported or defined
import { Button } from "@/components/ui/button";
import FileUploadSection from "../file_upload/page";
// Define interfaces for data fetched from backend
interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // --- Token Refresh Function ---
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log("🔄 Attempting token refresh...");
      const response = await axios.post("http://localhost:5000/api/auth/refreshToken", {}, {
        withCredentials: true,
      });

      if (response.status === 200) {
        console.log("✅ Token refresh successful");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      return false;
    }
  }, []);

  // --- Enhanced API Call with Auto-Retry ---
  const makeAuthenticatedRequest = useCallback(
    async function<T>(
      requestFn: () => Promise<T>,
      maxRetries: number = 1
    ): Promise<T> {
      let lastError: Error;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await requestFn();
        } catch (err) {
          const axiosError = err as AxiosError;
          lastError = axiosError;

          // If it's a 401/403 (token expired) and we haven't exhausted retries
          if ((axiosError.response?.status === 401 || axiosError.response?.status === 403) && attempt < maxRetries) {
            console.log(`🔄 Token expired, attempting refresh (attempt ${attempt + 1}/${maxRetries + 1})`);
            
            const refreshSuccess = await refreshToken();
            if (refreshSuccess) {
              console.log("✅ Token refreshed, retrying request...");
              continue; // Retry the request
            } else {
              console.log("❌ Token refresh failed, redirecting to login");
              toast.error("Session expired. Please log in again.");
              router.push("/login");
              throw new Error("Token refresh failed");
            }
          }
          
          // If it's not an auth error, or we've exhausted retries, throw the error
          throw axiosError;
        }
      }

      throw lastError!;
    },
    [refreshToken, router]
  );

  // --- Data Fetching Functions ---
  const fetchUserProfile = useCallback(async () => {
    setLoadingUser(true);
    setError(null);
    
    try {
      const response = await makeAuthenticatedRequest(async () => {
        return await axios.get<{
          message: string; 
          userId: string; 
          user: UserProfile 
        }>("/api/user/get-id", {
          withCredentials: true,
        });
      });

      if (response.status === 200 && response.data.user) {
        setUser(response.data.user);
      } else {
        throw new Error(response.data?.message || "Failed to fetch user profile.");
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      
      // Don't show error if we're redirecting to login
      if (axiosError.message !== "Token refresh failed") {
        const errorMessage =
          (axiosError.response?.data && typeof axiosError.response.data === "object" && "message" in axiosError.response.data
            ? (axiosError.response.data as { message?: string }).message
            : undefined)
          || axiosError.message
          || "An unexpected error occurred.";
        
        setError(`Failed to load user profile: ${errorMessage}`);
        toast.error(`Failed to load user: ${errorMessage}`);
      }
    } finally {
      setLoadingUser(false);
    }
  }, [makeAuthenticatedRequest]);

  // --- Effects ---
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // --- Logout Function ---
  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      const response = await makeAuthenticatedRequest(async () => {
        return await axios.post("http://localhost:5000/api/auth/logout", {}, {
          withCredentials: true,
        });
      });

      if (response.status === 200) {
        toast.success("Logout successful!");
        router.push("/login");
      } else {
        throw new Error("Logout failed.");
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      
      if (axiosError.message !== "Token refresh failed") {
        const errorMessage =
          (axiosError.response?.data && typeof axiosError.response.data === "object" && "message" in axiosError.response.data
            ? (axiosError.response.data as { message?: string }).message
            : undefined)
          || axiosError.message
          || "An unexpected error occurred.";
        
        setError(`Logout failed: ${errorMessage}`);
        toast.error(`Logout failed: ${errorMessage}`);
        console.error("Logout error:", err);
      }
    } finally {
      setLoadingLogout(false);
    }
  };

  // --- UI Rendering ---
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h2 className="text-3xl font-bold mb-4 text-red-500">Error Loading Dashboard</h2>
        <p className="text-lg mb-6 text-center">{error}</p>
        <div className="space-x-4">
          <Button 
            onClick={() => fetchUserProfile()} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Retry
          </Button>
          <Button 
            onClick={() => router.push("/login")} 
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 flex flex-col border-r border-gray-700 shadow-xl">
        <h1 className="text-2xl font-bold mb-10 text-center text-blue-400">
          DFI Dashboard
        </h1>
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold uppercase">
            {user?.name ? user.name.charAt(0) : user?.email.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name || user?.email}</p>
            <p className="text-sm text-gray-400">Welcome!</p>
          </div>
        </div>

        <nav className="space-y-3">
          {["Overview", "Upload", "Analytics", "Settings"].map((item) => (
            <Button
              key={item}
              className="w-full text-left py-2 px-4 rounded-lg text-lg font-medium transition-colors
                hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                flex items-center gap-3"
              onClick={() => {
                if (item === "Upload") {
                  router.push("/file_upload");
                }
              }}
            >
              {item === "Overview" && <DocumentTextIcon className="h-5 w-5" />}
              {item === "Upload" && <CloudArrowUpIcon className="h-5 w-5"  onClick={() => router.push("/file_upload")}/>}
              {item === "Analytics" && <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />}
              {item === "Settings" && <UserCircleIcon className="h-5 w-5" />}
              {item}
            </Button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-700">
          <Button
            className="w-full py-2 px-4 bg-red-600 rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2"
            onClick={handleLogout}
            disabled={loadingLogout}
          >
            {loadingLogout ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Logging Out...
              </>
            ) : (
              <>
                <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />
                Logout
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-900/90">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-blue-400">
            Dashboard Overview
          </h2>
          <input
            type="text"
            placeholder="Search files..."
            className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-sm"
          />
        </div>

        {/* Stats Section */}
        
        {/* File Upload Section */}
        <FileUploadSection onUploadSuccess={() => toast.success("Upload complete! File will appear in your list soon.")} />

        {/* Placeholder for User Files Section */}
      </main>
    </div>
  );
}