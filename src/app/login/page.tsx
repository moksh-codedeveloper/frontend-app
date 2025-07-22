/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { motion } from "framer-motion";
import { getCsrfToken } from "@/utils/getCsrfToken";
import { toast } from "sonner";
// import { div } from "framer-motion/client";
export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const login = async (email: string, password: string) => {
    try {
      const csrfToken = await getCsrfToken();
      // Step 2: Send login request with CSRF header
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken, // ✅ CSRF token here
          },
          withCredentials: true, // ✅ Important for cookies
        }
      );
      // Handle successful login
      if (response.status === 200) {
        // Redirect or show success message
        toast.success("Login successful!");
        setError("");
        // Optionally, you can redirect the user or update the UI
        console.log("Login successful");
      }
    } catch (error: string | any) {
      console.error("❌ Login error:", error.response?.data || error.message);
      toast.error("Login failed: " + (error.response?.data?.message || error.message));
      setError(error.response?.data?.message || "Login failed");
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-black">
      <Card className="w-full max-w-md p-6 bg-violet-400 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </div>
          <div className="mt-4 active:bg-amber-300 active:text-black">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="hover:bg-transparent text-cyan-500 active:bg-amber-300 active:text-black" placeholder="Password" />
          </div>
            <CardDescription className="mt-4 text-sm text-red-600">
              1. Make sure to use the Min length of 8 characters for the password.
              <br />
              2. Use a valid email address.
              <br />
              3. Include at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character.
              <br />
            </CardDescription>
          {error && <p className="text-red-500 mt-2">{error}</p>}
            <motion.button
              animate={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              disabled={loading}
              className="flex items-center justify-center w-full"
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
            >
              {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              ) : null}
              {loading ? "Logging in..." : "Login"}
            </motion.button>
        </CardContent>
      </Card>
    </div>
  );
}
/*
 minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
*/ 