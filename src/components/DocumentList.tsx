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
import { FolderPermission } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DownloadIcon, TrashIcon } from 'lucide-react';

import { getDocuments } from '@/app/actions';
import { useRootStore } from '@/stores';
import { DocumentWithVersions, FolderWithGroupPermissions } from '@/types';

import DocumentForm from './DocumentForm';

interface DocumentListProps {
  folderId: string;
  initialFolder?: FolderWithGroupPermissions;
}

export default function DocumentList({
  folderId,
  initialFolder,
}: DocumentListProps) {
  const isAdmin = useRootStore((state) => state.isAdmin); // Check if the user has FULL_ACCESS permission on the folder
  const hasFullAccess = (folder: FolderWithGroupPermissions) => {
    // For admin, full access
    if (isAdmin) {
      return true;
    }

    // Direct check for explicit permissions
    if (
      folder.groupPermissions.some(
        (p) => p.permission === FolderPermission.FULL_ACCESS
      )
    ) {
      return true;
    }

    // For inherited permissions, check the inheritedPermissionLevel property
    if (
      folder.isPermissionInherited &&
      folder.inheritedPermissionLevel === FolderPermission.FULL_ACCESS
    ) {
      return true;
    }

    return false;
  };

  // Check if the user has any access (READ_ONLY or FULL_ACCESS) to the folder
  const hasAnyAccess = (folder: FolderWithGroupPermissions) => {
    // For admin users, always grant access
    if (isAdmin) {
      return true;
    }

    // Direct check for explicit permissions (either READ_ONLY or FULL_ACCESS)
    if (folder.groupPermissions.length > 0) {
      return true;
    }

    // For inherited permissions, check if there's any permission level
    if (folder.isPermissionInherited && folder.inheritedPermissionLevel) {
      return true;
    }

    return false;
  };

  // Check if the user has full access to the current folder
  const currentFolderHasFullAccess = () => {
    // For admin users, always grant permission
    if (isAdmin) {
      return true;
    }

    // If initialFolder is provided, use it to check permissions
    if (initialFolder) {
      return hasFullAccess(initialFolder);
    }

    return false;
  };

  const {
    isLoading,
    data: allDocuments,
    refetch,
  } = useQuery<
    (DocumentWithVersions & { folder: FolderWithGroupPermissions })[]
  >({
    queryKey: ['documents', folderId],
    queryFn: () => getDocuments(folderId),
  });

  // Filter documents based on user permissions
  const data = allDocuments?.filter((document) => {
    // Admin can see all documents
    if (isAdmin) return true;

    // If initialFolder provided, check permission against it
    if (initialFolder) {
      return hasAnyAccess(initialFolder);
    }

    // Otherwise check permission against the document's folder
    return hasAnyAccess(document.folder);
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
      {(isAdmin || currentFolderHasFullAccess()) && (
        <DocumentForm folderId={folderId} onSuccess={refetch} />
      )}
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
          emptyContent={
            <div>
              {initialFolder && !hasAnyAccess(initialFolder)
                ? 'Bạn không có quyền xem tài liệu trong thư mục này.'
                : 'Không có tài liệu nào.'}
            </div>
          }
        >
          {(item) => (
            <TableRow key={item.fileName}>
              <TableCell>{item.fileName}</TableCell>
              <TableCell align="center">{item.versions[0].version}</TableCell>
              <TableCell>{item.createdAt.toLocaleString('vi-VN')}</TableCell>
              <TableCell className="flex items-center space-x-2 justify-end">
                {' '}
                <span
                  className="text-primary cursor-pointer active:opacity-50"
                  onClick={() => handleDownload(item.versions[0].minioKey)}
                >
                  <DownloadIcon size={16} />
                </span>
                {(isAdmin ||
                  (initialFolder
                    ? hasFullAccess(initialFolder)
                    : hasFullAccess(item.folder))) && (
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
