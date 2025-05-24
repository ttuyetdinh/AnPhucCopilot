'use client';

import { Button, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { FolderPermission } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, PencilIcon, TrashIcon, Users2Icon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { deleteFolder, getSubFoldersOfFolder } from '@/app/actions';
import { useRootStore } from '@/stores';
import { FolderWithUserPermissions } from '@/types';

import DocumentList from './DocumentList';
import FolderForm from './FolderForm';
import FolderPermissionForm from './FolderPermissionForm';

interface FolderListProps {
  initialFolder: FolderWithUserPermissions;
  isRoot: boolean;
}

export default function FolderList({ initialFolder, isRoot }: FolderListProps) {
  const isAdmin = useRootStore((state) => state.isAdmin);
  const userPermissions = isAdmin ? FolderPermission.FULL_ACCESS : initialFolder.userPermissions;
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [isFolderPermissionFormOpen, setIsFolderPermissionFormOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderWithUserPermissions | undefined>(undefined);

  const { isLoading, data, refetch } = useQuery({
    queryKey: ['folders', initialFolder.id, userPermissions, isRoot],
    queryFn: () => getSubFoldersOfFolder(initialFolder.id, userPermissions, isRoot),
  });

  const { mutateAsync: mutateDeleteFolder } = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      refetch();
    },
  });

  const handleDeleteFolder = async (id: string) => {
    const confirm = window.confirm('Bạn có chắc chắn muốn xóa thư mục này không?');
    if (confirm) {
      await mutateDeleteFolder(id);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {/* Temporary hardcode for the redirect */}
          <Button
            as={Link}
            href={
              initialFolder.parentId !== 'cmachor880000f17ocy9jh46i' ? `/folders/${initialFolder.parentId}` : '/folders'
            }
            isIconOnly
            isDisabled={!initialFolder.parentId}
          >
            <ArrowLeftIcon size={16} />
          </Button>
          {initialFolder.userPermissions == FolderPermission.FULL_ACCESS && (
            <Button color="primary" onPress={() => setIsFolderFormOpen(true)}>
              Tạo thư mục mới
            </Button>
          )}
        </div>
      </div>
      <Table shadow="none">
        <TableHeader>
          <TableColumn key="name">Tên</TableColumn>
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
          loadingContent={<Spinner label="Đang tải thư mục..." />}
          emptyContent={<div>Không có thư mục nào.</div>}
        >
          {(item) => (
            <TableRow key={item.name}>
              <TableCell>
                <Link href={`/folders/${item.id}`} className="hover:text-primary">
                  {item.name}
                </Link>
                {item.isPermissionInherited && (
                  <span className="ml-2 text-xs text-gray-500">(Inherited permissions)</span>
                )}
              </TableCell>
              <TableCell>{item.createdAt.toLocaleString('vi-VN')}</TableCell>
              <TableCell className="flex items-center space-x-2 justify-end">
                {item.userPermissions == FolderPermission.FULL_ACCESS && (
                  <>
                    {(isAdmin || !item.isPermissionInherited) && (
                      <span
                        className="text-warning cursor-pointer active:opacity-50"
                        onClick={() => {
                          setSelectedFolder(item);
                          setIsFolderPermissionFormOpen(true);
                        }}
                      >
                        <Users2Icon size={16} />
                      </span>
                    )}
                    <span
                      className="text-primary cursor-pointer active:opacity-50"
                      onClick={() => {
                        setSelectedFolder(item);
                        setIsFolderFormOpen(true);
                      }}
                    >
                      <PencilIcon size={16} />
                    </span>
                    {!item.isRoot && (
                      <span
                        className="text-danger cursor-pointer active:opacity-50"
                        onClick={() => handleDeleteFolder(item.id)}
                      >
                        <TrashIcon size={16} />
                      </span>
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {initialFolder.parentId && <DocumentList initialFolder={initialFolder} />}
      <FolderForm
        key={selectedFolder?.id ? `EDIT_FOLDER_${selectedFolder.id}` : 'NEW_FOLDER'}
        parentId={initialFolder.id}
        initialFolder={selectedFolder}
        isOpen={isFolderFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedFolder(undefined);
          }
          setIsFolderFormOpen(isOpen);
          refetch();
        }}
      />
      {selectedFolder && (
        <FolderPermissionForm
          key={`EDIT_FOLDER_PERMISSION_${selectedFolder.id}`}
          folderId={selectedFolder.id}
          isOpen={isFolderPermissionFormOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedFolder(undefined);
            }
            setIsFolderPermissionFormOpen(isOpen);
            refetch();
          }}
        />
      )}
    </div>
  );
}
