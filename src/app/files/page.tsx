/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { on } from "events";

interface FileItem {
  public_id: string;
  url: string;
  format: string;
  size: number;
}

export default function FileViewer() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"all" | "image" | "pdf">("all");
  const [globalProgress, setGlobalProgress] = useState(0);
  const fetchFiles = async (nextCursor: string | null = null) => {
    setLoading(true);
    setError(null); // Reset error state

    const params = new URLSearchParams();
    if (type !== "all") params.append("type", type);
    if (nextCursor) params.append("cursor", nextCursor);
    params.append("limit", "10");

    try {
      const res = await axios.get(`/api/cloudinary_fetch?${params.toString()}`, {
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setGlobalProgress(percent);
          }
        },
      },
      );

      const data = res.data;

      setFiles((prev) => [...prev, ...data.files]);
      setCursor(data.next_cursor || null);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset when type changes
    setFiles([]);
    setCursor(null);
    fetchFiles();
  }, [type]);

  return (
    <Card className="p-4 bg-gray-800 rounded-lg shadow-md">
      <CardTitle className="text-xl font-bold mb-4 text-white">Your Files</CardTitle>

      <div className="mb-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="border p-2 rounded bg-gray-700 text-white"
        >
          <option value="all">All</option>
          <option value="image">Images</option>
          <option value="pdf">PDFs</option>
        </select>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <Card className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {files.map((file) => (
          <div
            key={file.public_id}
            className="border rounded p-2 shadow bg-white"
          >
            <p className="text-sm mb-2 truncate">{file.public_id}</p>
            {file.format === "pdf" ? (
              <div className="bg-gray-100 p-4 text-center text-xs">📄 PDF File</div>
            ) : (
              <img src={file.url} alt={file.public_id} className="w-10 relative rounded" />
            )}
          </div>
        ))}
      </Card>

      {loading && (
        <CardDescription className="flex justify-center mt-4">
          <Progress value={globalProgress} className="h-3 bg-white"/>
        </CardDescription>
      )}

      {cursor && !loading && (
        <CardDescription className="mt-4">
          <Button
            onClick={() => fetchFiles(cursor)}
            className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition duration-200"
          >
            Load More
          </Button>
        </CardDescription>
      )}
    </Card>
  );
}
