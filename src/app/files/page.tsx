/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CloudinaryFile {
  public_id: string;
  url: string;
  format: string;
  size: number;
  created_at: string;
  display_name: string;
  width: number | null;
  height: number | null;
}

export default function GalleryPage() {
  const [files, setFiles] = useState<CloudinaryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await axios.post("/api/cloudinary_fetch", { type: "image" });
        setFiles(res.data.files || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch images");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">📸 My Cloudinary Images</h1>

      {loading && (
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin h-8 w-8 text-gray-600" />
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && files.length === 0 && (
        <p className="text-gray-500">No images found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {files.map((file) => (
          <Card key={file.public_id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="p-2 text-sm font-semibold truncate">
              {file.display_name}
            </CardHeader>
            <CardContent className="p-0">
              <img
                src={file.url}
                alt={file.display_name}
                className="w-full h-56 object-cover"
              />
              <div className="p-2 text-xs text-gray-600">
                {new Date(file.created_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
