"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface DocumentFormProps {
  onSuccess: () => void;
}

export default function DocumentForm({ onSuccess }: DocumentFormProps) {
  const { isPending: isUploading, mutateAsync: uploadFile } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      }).then((res) => res.json());

      return fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: uploadResponse.filename }),
      }).then((res) => res.json());
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        for (const file of acceptedFiles) {
          await uploadFile(file);
        }
        onSuccess();
      } catch (error) {
        console.error("Error uploading files:", error);

        alert("Có lỗi xảy ra khi tải file lên");
      }
    },
    [uploadFile, onSuccess]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="border p-4">
      <input {...getInputProps()} disabled={isUploading} />
      <p className="text-center">
        {isUploading
          ? "Đang tải lên..."
          : "Nhấn hoặc kéo thả file vào đây để tải lên"}
      </p>
    </div>
  );
}
