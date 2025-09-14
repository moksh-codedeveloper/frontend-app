/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { motion } from "framer-motion";
import { getCsrfToken } from "@/utils/getCsrfToken";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        toast.success("Login successful!");
        setError("");
        router.push("/"); // Redirect to dashboard after successful login
      }
    } catch (error: any) {
      toast.error("Login failed: " + (error.response?.data?.message || error.message));
      setError(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardHeader className="text-center pt-10">
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-sm text-gray-600">Sign in to access your dashboard</CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10 space-y-4">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-white border border-gray-300 placeholder-gray-500 focus:border-indigo-600 focus:ring-indigo-500"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-white border border-gray-300 placeholder-gray-500 focus:border-indigo-600 focus:ring-indigo-500"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              onClick={async () => {
                setError("");
                setLoading(true);
                try {
                  await login(email, password);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <p className="text-center text-sm text-gray-600 mt-4">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign up
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
