'use client';

import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DownloadIcon, TrashIcon } from 'lucide-react';

import { getDocuments } from '@/app/actions';
import { useRootStore } from '@/stores';
import { DocumentWithVersions } from '@/types';

import DocumentForm from './DocumentForm';

interface DocumentListProps {
  folderId: string;
}

export default function DocumentList({ folderId }: DocumentListProps) {
  const isAdmin = useRootStore((state) => state.isAdmin);

  const { isLoading, data, refetch } = useQuery<DocumentWithVersions[]>({
    queryKey: ['documents', folderId],
    queryFn: () => getDocuments(folderId),
  });

  const { mutateAsync: mutateDeleteDocument } = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/documents/${id}`, { method: 'DELETE' }).then((res) =>
        res.json()
      ),
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = async (id: string) => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn xóa tài liệu này không?'
    );
    if (confirm) {
      await mutateDeleteDocument(id);
    }
  };

  const handleDownload = async (fileKey: string) => {
    const elm = document.createElement('a');
    elm.href = `/api/files/${fileKey}/download`;
    elm.download = fileKey;
    elm.click();
  };

  return (
    <div className="flex flex-col space-y-2">
      {isAdmin && <DocumentForm folderId={folderId} onSuccess={refetch} />}
      <Table shadow="none">
        <TableHeader>
          <TableColumn key="name">Tên</TableColumn>
          <TableColumn key="version" align="center">
            Phiên bản
          </TableColumn>
          <TableColumn key="createdAt" width={200}>
            Ngày tạo
          </TableColumn>
          <TableColumn key="actions" align="end" width={200}>
            Hành động
          </TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          items={data || []}
          loadingContent={<Spinner label="Đang tải tài liệu..." />}
          emptyContent={<div>Không có tài liệu nào.</div>}
        >
          {(item) => (
            <TableRow key={item.fileName}>
              <TableCell>{item.fileName}</TableCell>
              <TableCell align="center">{item.versions[0].version}</TableCell>
              <TableCell>{item.createdAt.toLocaleString('vi-VN')}</TableCell>
              <TableCell className="flex items-center space-x-2 justify-end">
                <span
                  className="text-primary cursor-pointer active:opacity-50"
                  onClick={() => handleDownload(item.versions[0].minioKey)}
                >
                  <DownloadIcon size={16} />
                </span>
                {isAdmin && (
                  <span
                    className="text-danger cursor-pointer active:opacity-50"
                    onClick={() => handleDelete(item.id)}
                  >
                    <TrashIcon size={16} />
                  </span>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
