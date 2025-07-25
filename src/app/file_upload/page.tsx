/* eslint-disable @next/next/no-img-element */
// app/dashboard/file_upload_section.tsx
"use client";
import React, { useState, useCallback } from "react"; // Added useCallback
import axios, { AxiosError } from "axios"; // Added AxiosError
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader, CardTitle
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";


interface FileUploadSectionProps {
  onUploadSuccess: () => void; // This is the prop your dashboard will pass
}

interface FileWithProgress {
  file: File;
  progress: number;
  id: string; // Add a unique ID for better keying
}

// Rename the component and accept the props
export default function FileUploadSection({ onUploadSuccess }: FileUploadSectionProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0); // For overall progress if uploading multiple
  const [error, setError] = useState<string | null>(null); // For upload-specific errors

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);
    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      file,
      progress: 0,
      id: `${file.name}-${file.lastModified}-${Math.random()}`, // Simple unique ID
    }));
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = Array.from(e.target.files || []).map((file) => ({
      file,
      progress: 0,
      id: `${file.name}-${file.lastModified}-${Math.random()}`, // Simple unique ID
    }));
    setFiles((prev) => [...prev, ...selectedFiles]);
    // Clear input value to allow selecting same files again
    if (e.target) e.target.value = '';
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload.");
      return;
    }

    setUploading(true);
    setGlobalProgress(0); // Reset global progress
    setError(null);

    const formData = new FormData();
    const MAX_INDIVIDUAL_SIZE = 20 * 1024 * 1024; // 20MB limit
    const MAX_TOTAL_FILES = 5; // Example: Limit concurrent uploads
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // Example: 100MB total limit
    let currentTotalSize = 0;

    // Client-side validation before sending
    const validFiles: FileWithProgress[] = [];
    for (let i = 0; i < files.length; i++) {
        const item = files[i];
        if (item.file.size > MAX_INDIVIDUAL_SIZE) {
            toast.error(`"${item.file.name}" exceeds 20MB limit.`);
            setUploading(false);
            return;
        }
        currentTotalSize += item.file.size;
        validFiles.push(item);
    }

    if (validFiles.length > MAX_TOTAL_FILES) {
        toast.error(`You can upload a maximum of ${MAX_TOTAL_FILES} files at once.`);
        setUploading(false);
        return;
    }

    if (currentTotalSize > MAX_TOTAL_SIZE) {
        toast.error(`Total upload size exceeds ${MAX_TOTAL_SIZE / (1024 * 1024)}MB.`);
        setUploading(false);
        return;
    }

    validFiles.forEach((item) => formData.append("files", item.file));

    const loadingToastId = toast.loading("Preparing files for upload..."); // Start with a preparing message

    try {
      await axios.post("/cloudinary_upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setGlobalProgress(percent); // Update global progress bar
            // Optionally, update individual file progress here if you want
          }
        },
      });

      toast.dismiss(loadingToastId);
      toast.success("All files uploaded and analyzed successfully!");
      setFiles([]); // Clear files after successful upload
      setGlobalProgress(0); // Reset progress
      onUploadSuccess(); // Call the callback from the parent (Dashboard) to re-fetch files
    } catch (err) {
      toast.dismiss(loadingToastId);
      setUploading(false);
      setGlobalProgress(0);
      const axiosError = err as AxiosError;
      const errorMessage =
        (axiosError.response?.data && (axiosError.response.data as { message?: string }).message) ||
        axiosError.message ||
        "Something went wrong.";
      setError(`Upload failed: ${errorMessage}`);
      toast.error("Upload failed", {
        description: `Error: ${errorMessage}`,
      });
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }, [files, onUploadSuccess]); // Dependencies for useCallback

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
    setError(null); // Clear any file-specific errors when a file is removed
  }, []);

  return (
    <Card className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-xl font-bold text-green-400">Upload Files for Analysis</CardTitle>
        <p className="text-gray-400 text-sm mt-1">Upload documents, executables, or media for malicious file detection.</p>
      </CardHeader>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-600 rounded-lg p-10 text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        <p className="text-gray-400 text-lg">Drag & Drop your files here</p>
        <p className="text-gray-500 text-sm mt-2">or</p>
        <Button
          onClick={() => document.getElementById("file-input")?.click()}
          variant="outline"
          className="mt-4 border-blue-500 text-blue-300 hover:bg-blue-500 hover:text-white"
        >
          Browse Files
        </Button>
        <input
          type="file"
          id="file-input"
          className="hidden"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <p className="text-gray-500 text-xs mt-4">Max 20MB per file, up to 5 files (total 100MB)</p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">Selected Files:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((item) => (
                    <Card key={item.id} className="bg-gray-700 border-gray-600 p-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center space-x-3">
                            {item.file.type.startsWith("image/") ? (
                                <img
                                    src={URL.createObjectURL(item.file)}
                                    alt={item.file.name}
                                    className="w-10 h-10 object-cover rounded-md"
                                />
                            ) : (
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-600 rounded-md text-gray-300 text-sm">
                                    {item.file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{item.file.name}</p>
                                <p className="text-xs text-gray-400">{Math.round(item.file.size / 1024)} KB</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(item.id)}
                            className="text-gray-400 hover:text-red-500"
                        >
                            {/* You'll need an X icon, e.g., from Lucide React: <X className="h-4 w-4" /> */}
                            X 
                        </Button>
                    </Card>
                ))}
            </div>
            {uploading && (
                <div className="mt-4">
                    <p className="text-gray-300 mb-2">Overall Upload Progress:</p>
                    <Progress value={globalProgress} className="h-3" />
                    <p className="text-sm text-gray-400 mt-2">{globalProgress}%</p>
                </div>
            )}
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <Button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors mt-6"
            >
                {uploading ? "Uploading..." : "Upload Selected Files"}
            </Button>
        </div>
      )}
    </Card>
  );
}