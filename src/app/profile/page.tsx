/* eslint-disable @typescript-eslint/no-explicit-any */
// app/profile/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type UserProfile = {
  id: string;
  name?: string;
  email: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("http://localhost:5000/api/auth/profile", {
        withCredentials: true,
      });
      if (response.status === 200 && response.data.id) {
        setUser({
          id: response.data.id,
          name: response.data.name || response.data.user?.name,
          email: response.data.email || response.data.user?.email,
        });
      } else {
        throw new Error("Invalid profile data");
      }
    } catch (err: any) {
      setError("Failed to load profile");
      toast.error(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h2 className="text-2xl text-red-500 mb-4">Error</h2>
        <p className="text-center mb-6">{error}</p>
        <Button onClick={fetchProfile} className="px-6 py-3 bg-blue-600 hover:bg-blue-700">
          Retry
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>No user data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-8 flex justify-center items-center">
      <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">Profile</h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm text-gray-400 mb-1">User ID</h3>
            <p className="text-lg font-medium">{user.id}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm text-gray-400 mb-1">Name</h3>
            <p className="text-lg font-medium">{user.name || "Not provided"}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm text-gray-400 mb-1">Email</h3>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
