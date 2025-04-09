'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { getDocuments } from '@/app/actions';
import { DocumentWithVersions } from '@/types';

import DocumentForm from './DocumentForm';
import DocumentItem from './DocumentItem';

interface DocumentListProps {
  folderId: string;
}

export default function DocumentList({ folderId }: DocumentListProps) {
  const { data, refetch } = useQuery<DocumentWithVersions[]>({
    queryKey: ['documents', folderId],
    queryFn: () => getDocuments(folderId),
  });

  const { mutateAsync: mutateDeleteDocument } = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/documents/${id}`, { method: 'DELETE' }).then((res) =>
        res.json()
      ),
  });

  const handleDelete = async (id: string) => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn xóa tài liệu này không?'
    );
    if (confirm) {
      await mutateDeleteDocument(id);
      await refetch();
    }
  };

  const handleDownload = async (fileKey: string) => {
    const elm = document.createElement('a');
    elm.href = `/api/files/${fileKey}/download`;
    elm.download = fileKey;
    elm.click();
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
              versions={document.versions}
              onDownload={() => handleDownload(document.versions[0].minioKey)}
              onDelete={() => handleDelete(document.id)}
            />
          ))}
        </div>
      ) : (
        <div className="border p-4 text-center">Không có tài liệu nào.</div>
      )}
    </>
  );
}
