// app/dashboard/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
// Import simple icons instead of complex ones or images
import { UserCircleIcon, CloudArrowUpIcon, DocumentTextIcon, ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline'; // Example icons

// Assuming these are properly imported or defined
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui or similar button
import FileUploadSection from "../file_upload/page"; // Your file upload component

import { getCsrfToken } from "@/utils/getCsrfToken"; // Your CSRF token utility

// Define interfaces for data fetched from backend
interface UserProfile {
  id: string;
  email: string;
  name?: string; // Optional name
}

// We're removing UserFile and related states for now as the API is not ready
// interface UserFile {
//   id: string;
//   name: string;
//   url: string;
//   isMalicious: boolean;
//   uploadDate: string;
// }

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  // const [files, setFiles] = useState<UserFile[]>([]); // Removed: No file list API yet
  const [loadingUser, setLoadingUser] = useState(true);
  // const [loadingFiles, setLoadingFiles] = useState(true); // Removed: No file list API yet
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [error, setError] = useState<string | null>(null); // For general dashboard errors

  // --- Data Fetching Functions ---

  const fetchUserProfile = useCallback(async () => {
    setLoadingUser(true);
    setError(null);
    try {
      const response = await axios.get<{
        message: string; userId: string; user: UserProfile 
}>("/api/user/get-id");
      if (response.status === 200 && response.data.user) {
        setUser(response.data.user);
      } else {
        throw new Error(response.data?.message || "Failed to fetch user profile.");
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorMessage =
        (axiosError.response?.data && typeof axiosError.response.data === "object" && "message" in axiosError.response.data
          ? (axiosError.response.data as { message?: string }).message
          : undefined)
        || axiosError.message
        || "An unexpected error occurred.";
      setError(`Failed to load user profile: ${errorMessage}`);
      toast.error(`Failed to load user: ${errorMessage}`);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Removed fetchUserFiles and related useEffect call as there's no API for file listing yet
  // const fetchUserFiles = useCallback(async () => { ... }, [user?.id]);
  // useEffect(() => { if (user) { fetchUserFiles(); } }, [user, fetchUserFiles]);

  // --- Effects ---

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // --- Logout Function ---
  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      const csrfToken = await getCsrfToken();
      const backendLogoutUrl = "http://localhost:5000/api/auth/logout";

      const response = await axios.get(backendLogoutUrl, {
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        withCredentials: true,
      });

      if (response.status === 200) {
        toast.success("Logout successful!");
        router.push("/login");
      } else {
        throw new Error(response.data?.message || "Logout failed.");
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorMessage =
        (axiosError.response?.data && typeof axiosError.response.data === "object" && "message" in axiosError.response.data
          ? (axiosError.response.data as { message?: string }).message
          : undefined)
        || axiosError.message
        || "An unexpected error occurred.";
      setError(`Logout failed: ${errorMessage}`);
      toast.error(`Logout failed: ${errorMessage}`);
      console.error("Logout error:", err);
    } finally {
      setLoadingLogout(false);
    }
  };

  // --- UI Rendering ---

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Loading Dashboard...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h2 className="text-3xl font-bold mb-4 text-red-500">Error Loading Dashboard</h2>
        <p className="text-lg mb-6 text-center">{error}</p>
        <Button onClick={() => router.push("/login")} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
          Go to Login
        </Button>
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
          {["Overview", "Upload", "Analytics", "Settings"].map((item) => ( // Changed "Uploads" to "Upload" for singular focus
            <button
              key={item}
              className="w-full text-left py-2 px-4 rounded-lg text-lg font-medium transition-colors
                hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                flex items-center gap-3"
            >
              {item === "Overview" && <DocumentTextIcon className="h-5 w-5" />}
              {item === "Upload" && <CloudArrowUpIcon className="h-5 w-5" />}
              {item === "Analytics" && <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />} {/* Placeholder icon */}
              {item === "Settings" && <UserCircleIcon className="h-5 w-5" />}
              {item}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-700">
          <Button
            className="w-full py-2 px-4 bg-red-600 rounded-lg hover:bg-red-700 transition font-semibold"
            onClick={handleLogout}
            disabled={loadingLogout}
          >
            {loadingLogout ? "Logging Out..." : <><ArrowLeftEndOnRectangleIcon className="h-5 w-5 mr-2" /> Logout</>}
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
          {/* Search input remains for future use */}
          <input
            type="text"
            placeholder="Search files..."
            className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-sm"
          />
        </div>

        {/* Stats Section (Static for now, can be dynamic later) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {[
            { title: "Total Scans", value: "N/A", icon: "📊" }, // Placeholder
            { title: "Potential Threats", value: "N/A", icon: "⚠️" }, // Placeholder
            { title: "Files Processed", value: "N/A", icon: "📁" }, // Placeholder
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 text-center flex flex-col items-center justify-center"
            >
              <div className="text-5xl mb-2">{stat.icon}</div>
              <h2 className="text-4xl font-bold mb-1">{stat.value}</h2>
              <p className="text-gray-300">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* File Upload Section - Separate Component */}
        {/*
          IMPORTANT:
          The onUploadSuccess prop will trigger fetchUserFiles in the future.
          For now, it can just show a toast or a simple log.
          When you implement /api/user/files, uncomment the `useEffect` and `fetchUserFiles` in Dashboard,
          and ensure this callback is triggered by FileUploadSection.
        */}
        <FileUploadSection onUploadSuccess={() => toast.success("Upload complete! File will appear in your list soon.")} />

        {/* Placeholder for User Files Section - Will be enabled when API is ready */}
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg text-center text-gray-400">
          <h2 className="text-xl font-bold mb-6 text-orange-400">
            Your Scanned Files
          </h2>
          <p>This section will show your previously uploaded files and their analysis results.</p>
          <p className="mt-2">
            Stay tuned! We are building the feature to list your files here.
          </p>
          {/* When ready, replace this div with: */}
          {/* <UserFilesList files={files} loadingFiles={loadingFiles} /> */}
        </div>
      </main>
    </div>
  );
}

// Ensure your FileUploadSection component (file_upload_section.tsx) is updated as well.
// It will now just take `onUploadSuccess` as a prop.

// app/dashboard/file_upload_section.tsx (Updated)
// The content inside this component remains largely the same as my previous suggestion,
// but ensure it uses the `onUploadSuccess` prop.
// ... (content of FileUploadSection from previous response, just ensure it's in this file and takes the prop) ...