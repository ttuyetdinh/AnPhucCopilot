'use client';

import { Document } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';

import DocumentForm from './DocumentForm';
import DocumentItem from './DocumentItem';

export default function DocumentList() {
  const { data, refetch } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: () => fetch('/api/documents').then((res) => res.json()),
  });

  const { mutateAsync: deleteDocument } = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/documents/${id}`, { method: 'DELETE' }).then((res) =>
        res.json()
      ),
  });

  const handleDeleteDocument = async (id: string) => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn xóa tài liệu này không?'
    );
    if (confirm) {
      await deleteDocument(id);
      await refetch();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <DocumentForm onSuccess={refetch} />
      {data && data.length > 0 ? (
        <div className="flex flex-col gap-2 border p-4">
          {data.map((document, index) => (
            <DocumentItem
              key={index}
              fileName={document.fileName}
              onDelete={() => handleDeleteDocument(document.id)}
            />
          ))}
        </div>
      ) : (
        <div className="border p-4 text-center">Không có tài liệu nào.</div>
      )}
    </div>
  );
}
