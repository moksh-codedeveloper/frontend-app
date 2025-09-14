// app/page.tsx
"use client";
import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Home from "@/components/Home";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshToken = useCallback(async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/refreshToken", {}, {
        withCredentials: true,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/profile", {
        withCredentials: true,
      });
      if (response.status === 200) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const tokenRefreshed = await refreshToken();
      if (tokenRefreshed) {
        const profileExists = await fetchProfile();
        setIsLoggedIn(profileExists);
      }
      setLoading(false);
    };
    checkAuth();
  }, [refreshToken, fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return isLoggedIn ? <Dashboard /> : <Home />;
}