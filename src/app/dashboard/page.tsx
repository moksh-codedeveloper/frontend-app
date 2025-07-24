// app/dashboard/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";

// Assuming these are properly imported or defined
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui or similar button
import FilePages from "../file_upload/page"; // Your file upload component
import { getCsrfToken } from "@/utils/getCsrfToken"; // Your CSRF token utility

// Define interfaces for data fetched from backend
interface UserProfile {
  id: string;
  email: string;
  name?: string; // Optional name
}

interface UserFile {
  id: string;
  name: string;
  url: string;
  isMalicious: boolean; // Add this based on your project's purpose
  uploadDate: string; // ISO string or similar
  // Add other properties relevant to your files
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [error, setError] = useState<string | null>(null); // For general dashboard errors

  // --- Data Fetching Functions ---

  // Function to fetch User ID/Profile from Next.js API Route
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
      const axiosError = err as AxiosError<{ message?: string } | undefined>;
      const errorMessage = (axiosError.response?.data as { message?: string } | undefined)?.message || axiosError.message || "An unexpected error occurred.";
      setError(`Failed to load user profile: ${errorMessage}`);
      toast.error(`Failed to load user: ${errorMessage}`);
      // If user profile fails to load, it might indicate authentication issue
      // Consider redirecting to login if this is a critical failure
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        router.push("/login"); // Redirect to login on auth failure
      }
    } finally {
      setLoadingUser(false);
    }
  }, [router]); // router is a dependency for useCallback

  // Function to fetch user's files from your backend
  const fetchUserFiles = useCallback(async () => {
    if (!user?.id) return; // Only fetch if user ID is available
    setLoadingFiles(true);
    setError(null); // Clear previous error
    try {
      const backendApiUrl = process.env.NEXT_PUBLIC_NODE_BACKEND_URL || "http://localhost:5000";
      // Assuming your backend has an endpoint like /api/files/:userId or /api/user/files that expects cookie
      const response = await axios.get<UserFile[]>(`${backendApiUrl}/api/user/files`, {
         // The middleware should have ensured the 'token' cookie is present
         // So, axios will automatically send the 'token' cookie.
         // You might still need to include `withCredentials: true` if your backend is on a different origin.
         withCredentials: true,
      });

      if (response.status === 200) {
        setFiles(response.data);
      } else {
        throw new Error("Failed to fetch files.");
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string } | undefined>;
      const errorMessage = (axiosError.response?.data as { message?: string } | undefined)?.message || axiosError.message || "An unexpected error occurred.";
      setError(`Failed to load files: ${errorMessage}`);
      toast.error(`Failed to load files: ${errorMessage}`);
    } finally {
      setLoadingFiles(false);
    }
  }, [user?.id]); // Dependency on user.id

  // --- Effects ---

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Fetch files when user profile is loaded
  useEffect(() => {
    if (user) {
      fetchUserFiles();
    }
  }, [user, fetchUserFiles]); // Re-fetch if user changes or fetchUserFiles callback changes

  // --- Logout Function ---
  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      // CSRF token is crucial for POST/PUT/DELETE requests
      // For GET logout, CSRF token is not strictly needed for security,
      // but if your backend's logout endpoint is a POST, then it's essential.
      // Assuming your backend's logout is a GET as per your provided code,
      // CSRF token is not strictly needed for *this specific logout request*
      // but good to keep the `getCsrfToken` utility for other operations.
      const csrfToken = await getCsrfToken(); // Keep for consistency if other requests need it
      
      const backendLogoutUrl = process.env.NEXT_PUBLIC_NODE_BACKEND_URL
        ? `${process.env.NEXT_PUBLIC_NODE_BACKEND_URL}/api/auth/logout`
        : "http://localhost:5000/api/auth/logout";

      const response = await axios.get(backendLogoutUrl, {
        headers: {
          "X-CSRF-Token": csrfToken, // Your backend might not need this for a GET logout
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
      const errorMessage = (axiosError.response?.data as { message?: string } | undefined)?.message || axiosError.message || "An unexpected error occurred.";
      setError(`Logout failed: ${errorMessage}`);
      toast.error(`Logout failed: ${errorMessage}`);
      console.error("Logout error:", err);
    } finally {
      setLoadingLogout(false);
    }
  };

  // --- UI Rendering ---

  // Show loading state for user profile
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl"
        >
          Loading Dashboard...
        </motion.div>
      </div>
    );
  }

  // Show error if user profile could not be loaded
  if (error && !user) { // Only show this if user loading failed critically
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-red-500 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Error Loading Dashboard</h2>
          <p className="text-lg">{error}</p>
          <Button onClick={() => router.push("/login")} className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Main Dashboard Layout
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white/10 backdrop-blur-lg p-6 flex flex-col border-r border-white/5 shadow-xl">
        <h1 className="text-2xl font-bold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          DFI Dashboard
        </h1>
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-xl font-bold uppercase">
            {user?.name ? user.name.charAt(0) : user?.email.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name || user?.email}</p>
            <p className="text-sm text-gray-400">Welcome back!</p>
          </div>
        </div>

        <nav className="space-y-4">
          {["Overview", "Uploads", "Analytics", "Settings"].map((item, i) => (
            <motion.button
              key={i}
              whileHover={{ x: 5 }}
              className="w-full text-left py-2 px-4 rounded-lg text-lg font-medium transition-all duration-200
                hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                flex items-center gap-3" // Added flex for icon later
            >
              {/* Optional: Add icons here based on `item` name */}
              {item}
            </motion.button>
          ))}
        </nav>
        <div className="mt-auto">
          <Button
            className="w-full py-2 px-4 bg-red-600 rounded-lg hover:bg-red-700 transition font-semibold"
            onClick={handleLogout}
            disabled={loadingLogout}
          >
            {loadingLogout ? "Logging Out..." : "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Overview
          </h2>
          <input
            type="text"
            placeholder="Search files..."
            className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-sm"
          />
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {[
            { title: "Files Scanned", value: files.length, icon: "🔍" }, // Dynamic value
            { title: "Malicious Detected", value: files.filter(f => f.isMalicious).length, icon: "🚨" }, // Dynamic value
            { title: "Safe Files", value: files.filter(f => !f.isMalicious).length, icon: "✅" }, // Dynamic value
            // { title: "Formats Supported", value: "300+", icon: "📚" }, // More static, could be dynamic
            // { title: "Accuracy Rate", value: "99.9%", icon: "🎯" }, // More static, could be dynamic
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/5 text-center flex flex-col items-center justify-center"
            >
              <div className="text-5xl mb-2">{stat.icon}</div>
              <h2 className="text-4xl font-bold mb-1">{stat.value}</h2>
              <p className="text-gray-300">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Upload Section (using your FilePages component) */}
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl mb-10 border border-white/5 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">Upload New Files for Analysis</h2>
          <FilePages /> {/* Your existing FilePages component */}
        </div>

        {/* User Files Section - Displaying Recent Uploads/Scans */}
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/5 shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
            Your Scanned Files
          </h2>
          {loadingFiles ? (
            <div className="text-center text-gray-400">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="text-center text-gray-400">No files scanned yet. Upload your first file!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-lg truncate mb-1">{file.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">
                      Uploaded: {new Date(file.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${
                    file.isMalicious ? 'bg-red-700 text-red-100' : 'bg-green-700 text-green-100'
                  }`}>
                    {file.isMalicious ? 'Malicious' : 'Safe'}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Removed Analytics Chart section as requested */}
      </main>
    </div>
  );
}