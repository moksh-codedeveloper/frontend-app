"use client";

import { useState } from "react";
import { toast } from "sonner";
import FileUploadSection from "@/components/FileUpload";
import FileUploadSocket from "./FileSocketsUpload";
export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-blue-400">Dashboard Overview</h2>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-sm"
        />
      </div>

      {/* Stats Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {[
          { title: "Total Files", value: "42" },
          { title: "Storage Used", value: "1.2 GB" },
          { title: "Active Sessions", value: "3" },
        ].map((stat, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">{stat.title}</h3>
            <p className="text-2xl text-blue-400 font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* File Upload Section */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Upload Files</h3>
        <FileUploadSection
          onUploadSuccess={() => {
            toast.success("Files uploaded successfully!");
          }}
        />
        <FileUploadSocket
          onUploadSuccess={() => {
            toast.success("Files uploaded successfully via WebSocket!");
          }}
        />
      </div>
    </div>
  );
}
