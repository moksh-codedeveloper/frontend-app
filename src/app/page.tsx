"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white overflow-hidden">
      {/* Animated Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl max-w-lg w-full text-center"
      >
        {/* Animated Heading */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold mb-4 tracking-tight"
        >
          🚀 Secure Upload
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg mb-8 opacity-90"
        >
          Upload and manage your files securely. Please log in or sign up to
          continue.
        </motion.p>

        {/* Buttons with Hover Animation */}
        <div className="flex justify-center gap-6 mb-6">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Link href="/login">
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold shadow-md">
                Login
              </button>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Link href="/signup">
              <button className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-semibold shadow-md">
                Sign Up
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm opacity-80"
        >
          Powered by <span className="font-bold">Next.js</span> +{" "}
          <span className="font-bold">Cloudinary</span>
        </motion.p>
      </motion.div>
    </div>
  );
}
