/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { motion } from "framer-motion";
import { getCsrfToken } from "@/utils/getCsrfToken";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

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
      }
    } catch (error: any) {
      toast.error("Login failed: " + (error.response?.data?.message || error.message));
      setError(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-white/10 shadow-2xl border border-white/20 rounded-2xl">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
            <p className="text-gray-300 text-sm">Sign in to continue your journey</p>
          </CardHeader>

          <CardContent className="p-6">
            {/* Email Input */}
            <div>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-indigo-400 focus:ring-indigo-400 transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="mt-4">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-indigo-400 focus:ring-indigo-400 transition-all"
              />
            </div>

            {/* Description */}
            <CardDescription className="mt-4 text-xs text-gray-400 leading-relaxed">
              Password must have:
              <br />• Minimum 8 characters
              <br />• At least 1 uppercase & lowercase letter
              <br />• At least 1 number & 1 special character
            </CardDescription>

            {error && <p className="text-red-400 mt-2">{error}</p>}

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              disabled={loading}
              onClick={async (e) => {
                e.preventDefault();
                setError("");
                setLoading(true);
                try {
                  await login(email, password);
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-6 w-full py-3 rounded-xl font-semibold text-lg text-white 
                        bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                        hover:from-pink-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/50 
                        transition-all duration-300 relative overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </motion.button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
