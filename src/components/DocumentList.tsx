"use client";

import { Document } from "@prisma/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function DocumentList() {
  const { data, refetch } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: () => fetch("/api/documents").then((res) => res.json()),
  });

  const { mutateAsync: deleteDocument } = useMutation({
    mutationFn: (documentName: string) =>
      fetch(`/api/documents/${documentName}`, { method: "DELETE" }).then(
        (res) => res.json()
      ),
  });

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
        body: JSON.stringify({ documentName: uploadResponse.documentName }),
      }).then((res) => res.json());
    },
  });

  const handleDeleteDocument = async (documentName: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (confirm) {
      await deleteDocument(documentName);
      refetch();
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        for (const file of acceptedFiles) {
          await uploadFile(file);
        }
        refetch();
      } catch (error) {
        console.error("Error uploading files:", error);
        alert("Có lỗi xảy ra khi tải file lên");
      }
    },
    [uploadFile, refetch]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col gap-4">
      <div {...getRootProps()} className="border p-4">
        <input {...getInputProps()} disabled={isUploading} />
        <p className="text-center">
          {isUploading ? "Đang tải lên..." : "Thả file vào đây để tải lên"}
        </p>
      </div>
      {data && data.length > 0 ? (
        <div className="flex flex-col gap-2 border p-4">
          {data.map((document, index) => (
            <div key={index} className="border-b py-2 flex justify-between">
              <div>{document.documentName}</div>
              <button
                className="text-red-500 cursor-pointer"
                onClick={() => handleDeleteDocument(document.documentName)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center border p-4">No documents found.</div>
      )}
    </div>
  );
}
