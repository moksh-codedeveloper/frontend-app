"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function FileUploadSection({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = new WebSocket("ws://localhost:8000/ws/files/");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      toast.success("Connected to server");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        toast.success(data.message);
      }
      if (data.parsed_text) {
        console.log("Parsed text:", data.parsed_text);
        toast.success("File processed!");
        onUploadSuccess?.();
      }
    };

    socket.onerror = () => {
      toast.error("WebSocket error");
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      toast.error("Disconnected from server");
    };

    return () => {
      socket.close();
    };
  }, [onUploadSuccess]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast.error("WebSocket is not connected");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      socketRef.current!.send(arrayBuffer);
      setUploading(false);
      toast.info("File sent, waiting for response...");
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={handleFileChange}
        className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg"
      />
      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-blue-600 hover:bg-blue-700 transition-all"
      >
        {uploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}
