// app/page.tsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRightIcon } from '@heroicons/react/20/solid'; // Example icon, install if needed: npm install @heroicons/react

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-zinc-900 to-black text-white overflow-hidden p-4">
      {/* Optional: Floating Background Elements for Visual Interest */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-green-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-3xl max-w-2xl w-full text-center sm:p-12"
      >
        {/* Animated Heading */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight leading-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">File Decoder SaaS</span>
          <br />
          Uncover Malicious Files
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg sm:text-xl mb-8 opacity-90 leading-relaxed"
        >
          Leveraging **Machine Learning**, we transform raw files into intelligent insights to detect and predict malware with high accuracy. Upload, analyze, and secure your digital world.
        </motion.p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link href="/login">
              <button className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-4 rounded-full font-semibold shadow-lg transition-all duration-300 transform w-full sm:w-auto">
                Login
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </button>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link href="/register">
              <button className="flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-8 py-4 rounded-full font-semibold shadow-lg transition-all duration-300 transform w-full sm:w-auto">
                Get Started
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Feature Highlights (Optional, but good for landing page) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm opacity-80 mt-10"
        >
          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="font-bold text-base mb-1">AI-Powered Analysis</h3>
            <p>Advanced ML models for accurate threat detection.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="font-bold text-base mb-1">Secure & Scalable</h3>
            <p>Your data is protected with robust infrastructure.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="font-bold text-base mb-1">Real-time Insights</h3>
            <p>Get instant predictions and comprehensive reports.</p>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-sm opacity-70 mt-10"
        >
          Built with <span className="font-bold">Next.js</span>, backed by{" "}
          <span className="font-bold">Cloudinary</span>.
        </motion.p>
      </motion.div>
    </div>
  );
}

// Optional: Add blob animation to your global CSS (e.g., app/globals.css)
/*
@keyframes blob {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
}

.animate-blob {
  animation: blob 7s infinite cubic-bezier(0.6, 0.01, 0.2, 1);
}

.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }
*/