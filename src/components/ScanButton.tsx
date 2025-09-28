/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription } from "./ui/card";
import axios from "axios";
function ScanButton() {
  const [data, setData] = useState(null);
  const fetchImageData = async () => {
    try {
      const userID = await axios.get("http://localhost:5000/api/auth/profile", {
        withCredentials: true,
      });

      const id = userID.data.id || userID.data.user?.id;
      const response = await axios.post(
        "http://localhost:8000/fetch/images/scan/",
        {
          id: id,
        },
        {
          withCredentials: true,
        }
      );
      setData(response.data);
    } catch (error: any) {
      console.log(error.message);
    }
  };
  return (
    <Card className="bg-zinc-900 border border-cyan-500/20 shadow-xl rounded-2xl p-4">
      <Button className="bg-gradient-to-r from-blue-400 to-cyan-400 text-black font-bold rounded-full px-6 py-2 shadow-lg transition-all duration-300 hover:from-cyan-400 hover:to-blue-400 hover:scale-110 hover:shadow-cyan-500/50 active:scale-95" onClick={fetchImageData}>
        Scan me
      </Button>
      <CardContent className="mt-4">
        <CardDescription className="bg-black text-white rounded-xl p-3 border border-cyan-500/30 shadow-inner transition-all duration-300 hover:border-cyan-400">
            {data ? JSON.stringify(data, null, 2) : "Loading"}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export default ScanButton;
