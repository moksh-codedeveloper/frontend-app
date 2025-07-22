"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#4F46E5", "#EC4899", "#10B981", "#F59E0B"];
const chartData = [
  { name: "Images", value: 400 },
  { name: "Documents", value: 300 },
  { name: "Videos", value: 200 },
  { name: "Others", value: 100 },
];

export default function Dashboard() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white/10 backdrop-blur-lg p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-center">DFI Dashboard</h1>
        <nav className="space-y-4">
          {["Overview", "Uploads", "Analytics", "Settings"].map((item, i) => (
            <button
              key={i}
              className="w-full text-left py-2 px-4 rounded-lg hover:bg-white/20 transition"
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <button className="w-full py-2 px-4 bg-red-500 rounded-lg hover:bg-red-600 transition">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <input
            type="text"
            placeholder="Search files..."
            className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg focus:outline-none w-64"
          />
          <div className="w-10 h-10 bg-white rounded-full"></div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { title: "Files Analyzed", value: "5M+" },
            { title: "Formats Supported", value: "300+" },
            { title: "Accuracy Rate", value: "99.9%" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg text-center"
            >
              <h2 className="text-4xl font-bold">{stat.value}</h2>
              <p className="text-gray-300">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl mb-10">
          <h2 className="text-xl font-bold mb-4">Upload Files</h2>
          <div
            className="border-2 border-dashed border-gray-400 rounded-lg p-10 text-center cursor-pointer hover:border-indigo-400"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              type="file"
              id="file-input"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(e.target.files[0]);
              }}
            />
            <p className="text-gray-300">Drag & Drop or Click to Upload</p>
          </div>

          {uploading && (
            <div className="mt-6">
              <p className="text-gray-300 mb-2">Uploading: {fileName}</p>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="mt-2">{progress}%</p>
            </div>
          )}
        </div>

        {/* Analytics Chart */}
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
          <h2 className="text-xl font-bold mb-6">File Type Distribution</h2>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
