/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import motion from "motion";
import { getCsrfToken } from "@/utils/getCsrfToken";
import { toast } from "sonner";
// import { div } from "framer-motion/client";
export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 text-black">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Please enter your email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Please enter your password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <CardDescription>
              1. Make sure to use the Min length of 8 characters for the password.
              <br />
              2. Use a valid email address.
              <br />
              3. Include at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character.
              <br />
            </CardDescription>
          </div>
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