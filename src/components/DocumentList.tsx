'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { getDocuments } from '@/app/actions';
import { DocumentWithVersions } from '@/types';

import DocumentForm from './DocumentForm';
import DocumentItem from './DocumentItem';

export default function DocumentList({ folderId }: { folderId: string }) {
  const { data, refetch } = useQuery<DocumentWithVersions[]>({
    queryKey: ['documents'],
    queryFn: () => getDocuments(folderId),
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

  const handleDownloadDocument = async (fileKey: string) => {
    const a = document.createElement('a');
    a.href = `/api/files/${fileKey}/download`;
    a.download = fileKey;
    a.click();
  };

  return (
    <>
      <DocumentForm folderId={folderId} onSuccess={refetch} />
      {data && data.length > 0 ? (
        <div className="flex flex-col gap-2 border p-4">
          {data.map((document, index) => (
            <DocumentItem
              key={index}
              fileName={document.fileName}
              onDownload={() =>
                handleDownloadDocument(document.versions[0].minioKey)
              }
              onDelete={() => handleDeleteDocument(document.id)}
            />
          ))}
        </div>
      ) : (
        <div className="border p-4 text-center">Không có tài liệu nào.</div>
      )}
    </>
  );
}
