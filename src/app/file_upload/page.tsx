/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileWithProgress {
  file: File;
  progress: number;
}

export default function FileUploadPage() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      file,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).map((file) => ({
      file,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleUpload = async () => {
    setUploading(true);
    const formData = new FormData();
    files.forEach((item) => formData.append("files", item.file));

    const loadingToast = toast.loading("Uploading files...");

    try {
      await axios.post("/api/cloudinary_upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setFiles((prev) =>
            prev.map((item) => ({ ...item, progress: percent }))
          );
        },
      });

      toast.dismiss(loadingToast);
      toast.success("All files uploaded successfully!");
    } catch (error: any) {
      toast.dismiss();
      toast.error("Upload failed", {
        description: error?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 max-w-xl mx-auto mt-10 space-y-4">
      <h2 className="text-xl font-bold text-center">Upload Multiple Files</h2>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-400 rounded-md p-8 text-center cursor-pointer hover:border-blue-500"
      >
        Drag & drop your files here
      </div>

      <input type="file" multiple onChange={handleFileSelect} className="w-full" />

      {/* Preview Grid */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {files.map((item, idx) => (
          <div key={idx} className="p-2 border rounded-md">
            {item.file.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(item.file)}
                alt={item.file.name}
                className="w-full h-32 object-cover rounded-md"
              />
            ) : (
              <p className="text-sm text-gray-700">{item.file.name}</p>
            )}
            <Progress value={item.progress} className="mt-2" />
          </div>
        ))}
      </div>

      <Button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="w-full bg-blue-600 text-white"
      >
        {uploading ? "Uploading..." : "Upload All"}
      </Button>
    </Card>
  );
}
