/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { motion } from "framer-motion";
import { getCsrfToken } from "@/utils/getCsrfToken";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const register = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      const csrfToken = await getCsrfToken();
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        { name, email, password },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          withCredentials: true,
        }
      );
      if (response.status === 201) {
        toast.success("Registration successful!");
        setError("");
        router.push("/login");
      }
    } catch (error: any) {
      toast.error(
        "Registration failed: " +
          (error.response?.data?.message || error.message)
      );
      setError(error.response?.data?.message || "Registration failed");
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
            <CardTitle className="text-2xl font-bold text-gray-900">Create your DFIT account</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="bg-white border border-gray-300 placeholder-gray-500 focus:border-indigo-600 focus:ring-indigo-500"
              />
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
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="bg-white border border-gray-300 placeholder-gray-500 focus:border-indigo-600 focus:ring-indigo-500"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                onClick={async () => {
                  setError("");
                  setLoading(true);
                  try {
                    await register();
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Register"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign in
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
