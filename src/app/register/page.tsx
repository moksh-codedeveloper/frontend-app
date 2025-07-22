/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        router.push("/login"); // Redirect to login page after successful registration
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-200 via-teal-100 to-white">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 backdrop-blur-lg shadow-xl border border-gray-200 rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Create Account
            </CardTitle>
            <p className="text-gray-500 text-sm">
              Join us and start your journey
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Name Input */}
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:ring-emerald-400 transition-all"
            />

            {/* Email */}
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:ring-emerald-400 transition-all"
            />

            {/* Password */}
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:ring-emerald-400 transition-all"
            />

            {/* Confirm Password */}
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:ring-emerald-400 transition-all"
            />

            <CardDescription className="text-xs text-gray-500 mt-2">
              Password should include:
              <br />• 8+ characters, 1 uppercase, 1 number, 1 special char.
            </CardDescription>

            {error && <p className="text-red-500">{error}</p>}

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
                  await register();
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-4 w-full py-3 rounded-xl font-semibold text-lg text-white 
                        bg-gradient-to-r from-teal-500 via-emerald-400 to-green-400 
                        hover:from-green-400 hover:to-teal-500 shadow-lg shadow-emerald-500/50 
                        transition-all duration-300"
            >
              {loading ? "Creating Account..." : "Register"}
            </motion.button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
