/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription } from "./ui/card";
import axios from "axios";

interface ScanData {
  url: string;
}

function ScanButton() {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchImageData = async () => {
    try {
      setLoading(true);

      // 1. get user profile
      const userRes = await axios.get("http://localhost:5000/api/auth/profile", {
        withCredentials: true,
      });

      const id = userRes.data.id || userRes.data.user?.id;

      // 2. fetch scan data
      const scanRes = await axios.get<ScanData>(
        `http://localhost:8000/scan/${id}`
      );

      setData(scanRes.data);
    } catch (error: any) {
      console.error("Error fetching image:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border border-cyan-500/20 shadow-xl rounded-2xl p-4">
      <Button
        className="bg-gradient-to-r from-blue-400 to-cyan-400 text-black font-bold rounded-full px-6 py-2 shadow-lg hover:from-cyan-400 hover:to-blue-400 hover:shadow-cyan-500/50"
        onClick={fetchImageData}
        disabled={loading}
      >
        {loading ? "Scanning..." : "Scan me"}
      </Button>
      <CardContent className="mt-4">
        <CardDescription className="bg-black text-white rounded-xl p-3 border border-cyan-500/30 shadow-inner transition-all duration-300 hover:border-cyan-400">
          {data ? (
            <img src={data.url} alt="Scanned result" className="rounded-xl" />
          ) : (
            "No scan yet"
          )}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export default ScanButton;
