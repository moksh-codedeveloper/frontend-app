/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

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
      });

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
    <div className="p-4 bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4 text-white">Your Files</h1>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {files.map((file) => (
          <div
            key={file.public_id}
            className="border rounded p-2 shadow bg-white"
          >
            <p className="text-sm mb-2 truncate">{file.public_id}</p>
            {file.format === "pdf" ? (
              <div className="bg-gray-100 p-4 text-center text-xs">📄 PDF File</div>
            ) : (
              <img src={file.url} alt={file.public_id} className="w-full rounded" />
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {cursor && !loading && (
        <div className="mt-4">
          <button
            onClick={() => fetchFiles(cursor)}
            className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition duration-200"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
