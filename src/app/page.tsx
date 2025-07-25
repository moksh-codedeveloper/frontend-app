/* eslint-disable react/no-unescaped-entities */
// app/page.tsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRightIcon, FileTextIcon, CodeIcon, BrainCircuitIcon, FlaskConicalIcon, CheckCircleIcon } from 'lucide-react'; // Using Lucide React for icons, install if needed: npm install lucide-react

// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {  } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white overflow-hidden p-4">
      {/* Subtle Background Mesh / Gradient - Alternative to Blobs for less resource intensity */}
      <div className="absolute inset-0 z-0 bg-dot-grid-white opacity-5 pointer-events-none"></div>

      {/* Main Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 bg-gradient-to-br from-gray-800/20 to-gray-900/20 backdrop-blur-xl border border-gray-700/50 p-6 sm:p-10 rounded-3xl shadow-2xl max-w-4xl w-full text-center"
      >
        {/* Animated Heading */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">File Decoder SaaS</span>
          <br />
          Intelligent Malware Detection
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg sm:text-xl mb-10 opacity-90 leading-relaxed max-w-2xl mx-auto"
        >
          Unravel the hidden nature of files. We transform raw data into powerful insights using advanced Machine Learning, predicting malicious threats with precision.
        </motion.p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link href="/login" passHref>
              <Button
                className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-4 rounded-full font-semibold shadow-lg transition-all duration-300 transform w-full sm:w-auto text-lg"
              >
                Login to Analyze
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link href="/register" passHref>
              <Button
                variant="outline" // Use Shadcn outline variant
                className="flex items-center justify-center border-2 border-green-500 text-green-300 hover:bg-green-500 hover:text-white px-8 py-4 rounded-full font-semibold shadow-lg transition-all duration-300 transform w-full sm:w-auto text-lg"
              >
                Get Started
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* The "Funda" Section - Core Process Explained */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-left"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-500">
            Our Core Process: Decoding Malware
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gray-800/50 border-gray-700 text-white shadow-xl">
              <CardHeader className="flex flex-col items-center">
                <FileTextIcon className="h-10 w-10 mb-3 text-blue-400" />
                <CardTitle className="text-xl font-semibold">1. File Ingestion</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                Upload any document, executable, or media file. Our system securely ingests the raw data.
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 text-white shadow-xl">
              <CardHeader className="flex flex-col items-center">
                <CodeIcon className="h-10 w-10 mb-3 text-yellow-400" />
                <CardTitle className="text-xl font-semibold">2. NumPy Transformation</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                The magic begins here: we convert the file's binary data into a structured **NumPy matrix**, ready for analysis.
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 text-white shadow-xl">
              <CardHeader className="flex flex-col items-center">
                <BrainCircuitIcon className="h-10 w-10 mb-3 text-purple-400" />
                <CardTitle className="text-xl font-semibold">3. ML Model Prediction</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                Our optimized **Scikit-learn models** analyze the NumPy matrix, identifying patterns indicative of malicious behavior.
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 text-white shadow-xl md:col-span-1 lg:col-span-2 mx-auto w-full max-w-lg">
                <CardHeader className="flex flex-col items-center">
                    <FlaskConicalIcon className="h-10 w-10 mb-3 text-red-400" />
                    <CardTitle className="text-xl font-semibold">4. Threat Analysis & Report</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300">
                    Receive an immediate, actionable report detailing whether the file is benign or potentially malicious. Understand the risks at a glance.
                </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 text-white shadow-xl mx-auto w-full max-w-lg">
                <CardHeader className="flex flex-col items-center">
                    <CheckCircleIcon className="h-10 w-10 mb-3 text-green-400" />
                    <CardTitle className="text-xl font-semibold">5. Secure Your Digital World</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300">
                    Empower your defense. Our continuous learning models evolve to protect you against new threats.
                </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-sm opacity-70 mt-12"
        >
          Built with <span className="font-bold">Next.js</span>, backend powered by{" "}
          <span className="font-bold">Node.js ML</span>, storage via{" "}
          <span className="font-bold">Cloudinary</span>.
        </motion.p>
      </motion.div>
    </div>
  );
}

// Add this to your `app/globals.css` for a subtle background pattern
/*
.bg-dot-grid-white {
  background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
*/