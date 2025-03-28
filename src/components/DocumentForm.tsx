'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DocumentFormProps {
  folderId: string;
  onSuccess: () => void;
}

export default function DocumentForm({
  folderId,
  onSuccess,
}: DocumentFormProps) {
  const { isPending: isUploading, mutateAsync: mutateUploadFile } = useMutation(
    {
      mutationFn: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        }).then((res) => res.json());

        return fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folderId: folderId,
            fileName: file.name,
            fileKey: uploadResponse.fileKey,
          }),
        }).then((res) => res.json());
      },
    }
  );

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        for (const file of acceptedFiles) {
          await mutateUploadFile(file);
        }
        onSuccess();
      } catch (error) {
        console.error('Error uploading files:', error);

        alert('Có lỗi xảy ra khi tải file lên');
      }
    },
    [mutateUploadFile, onSuccess]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop: handleDrop });

  return (
    <div {...getRootProps()} className="border p-4">
      <input
        {...getInputProps()}
        multiple={false}
        accept="application/pdf"
        disabled={isUploading}
      />
      <p className="text-center">
        {isUploading
          ? 'Đang tải lên...'
          : 'Nhấn hoặc kéo thả file vào đây để tải lên'}
      </p>
    </div>
  );
}
