"use client";
import { Input } from "@/components/ui/input";
import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FilePages() {
  const { register, handleSubmit } = useForm<{ file: FileList }>();
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (data: { file: FileList }) => {
    const selectedFile = data.file?.[0];
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      toast.loading("Uploading...");
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Upload successful!");
      console.log("Response:", res.data);
    } catch (error) {
      toast.error("Upload failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form className="space-y-4 p-4" onSubmit={handleSubmit(onSubmit)}>
        <label
          className="block text-sm font-medium text-gray-700 mb-2"
          htmlFor="file"
        >
          Upload file
        </label>
        <Input
          id="file"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          {...register("file")}
        />
        <Button
          type="submit"
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Submit"}
        </Button>
      </form>
    </Card>
  );
}
