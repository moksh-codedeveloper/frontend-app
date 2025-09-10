/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
export default function PdfTextExtraction() {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // ✅ Get user ID
      const userIdRes = await axios.get("/api/user/get-id", {
        withCredentials: true,
      });
      const userId = userIdRes.data.user.user.id;


      // ✅ Call backend API to analyze PDF
      const res = await axios.get(
        `http://localhost:8000/pdfs/fetch/${userId}/`,
        {
          withCredentials: true,
        }
      );

      // ✅ Update state with the extracted text
      setData(res.data.text || "No text found.");

    } catch (err: any) {
      // ✅ Handle errors gracefully
      setError(err.response?.data?.error || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto my-8 p-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <h2 className="text-xl font-semibold">PDF Text Extraction</h2>
      </CardHeader>
      <CardDescription>
        Extract text from your uploaded PDFs quickly and easily.
      </CardDescription>
      <CardContent>
        <Button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
          disabled={loading}
        >
          {loading ? "Processing..." : "Extract Text"}
        </Button>

        <div className="mt-4 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200 min-h-[150px]">
          {error ? (
            <p className="text-red-600">{error}</p>
          ) : data ? (
            <p>{data}</p>
          ) : (
            <p className="text-gray-500">Click the button to extract PDF text.</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500">Results are fetched securely using your authenticated session.</p>
      </CardFooter>
    </Card>
  );
}
