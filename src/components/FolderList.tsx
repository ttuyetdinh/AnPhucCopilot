'use client';

import {
  Button,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Folder } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, PencilIcon, TrashIcon, Users2Icon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { deleteFolder, getFolders } from '@/app/actions';
import { useRootStore } from '@/stores';
import { FolderWithGroupPermissions } from '@/types';

import DocumentList from './DocumentList';
import FolderForm from './FolderForm';
import FolderPermissionForm from './FolderPermissionForm';

interface FolderListProps {
  initialFolder: Folder;
}

export default function FolderList({ initialFolder }: FolderListProps) {
  const isAdmin = useRootStore((state) => state.isAdmin);

  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [isFolderPermissionFormOpen, setIsFolderPermissionFormOpen] =
    useState(false);
  const [selectedFolder, setSelectedFolder] = useState<
    FolderWithGroupPermissions | undefined
  >(undefined);

  const { isLoading, data, refetch } = useQuery({
    queryKey: ['folders', initialFolder.id],
    queryFn: () => getFolders(initialFolder.id),
  });

  const { mutateAsync: mutateDeleteFolder } = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      refetch();
    },
  });

  const handleDeleteFolder = async (id: string) => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn xóa thư mục này không?'
    );
    if (confirm) {
      await mutateDeleteFolder(id);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            as={Link}
            href={`/folders/${initialFolder.parentId}`}
            isIconOnly
            isDisabled={!initialFolder.parentId}
          >
            <ArrowLeftIcon size={16} />
          </Button>
          {isAdmin && (
            <Button color="primary" onPress={() => setIsFolderFormOpen(true)}>
              Tạo thư mục mới
            </Button>
          )}
        </div>
        <Input
          placeholder="Tìm kiếm thư mục"
          variant="bordered"
          className="w-full max-w-xs"
        />
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
                <Link
                  href={`/folders/${item.id}`}
                  className="hover:text-primary"
                >
                  {item.name}
                </Link>
              </TableCell>
              <TableCell>{item.createdAt.toLocaleString('vi-VN')}</TableCell>
              <TableCell className="flex items-center space-x-2 justify-end">
                {isAdmin && (
                  <>
                    <span
                      className="text-warning cursor-pointer active:opacity-50"
                      onClick={() => {
                        setSelectedFolder(item);
                        setIsFolderPermissionFormOpen(true);
                      }}
                    >
                      <Users2Icon size={16} />
                    </span>
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
      {initialFolder.parentId && <DocumentList folderId={initialFolder.id} />}
      <FolderForm
        key={
          selectedFolder?.id ? `EDIT_FOLDER_${selectedFolder.id}` : 'NEW_FOLDER'
        }
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
