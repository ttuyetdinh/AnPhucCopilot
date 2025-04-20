'use client';

import {
  Button,
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
import { ArrowLeftIcon, PencilIcon, TrashIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';

import {
  createFolder,
  deleteFolder,
  getFolders,
  updateFolder,
} from '@/app/actions';

import DocumentList from './DocumentList';

interface FolderListProps {
  initialFolder: Folder;
}

export default function FolderList({ initialFolder }: FolderListProps) {
  const { isLoading, data, refetch } = useQuery<Folder[]>({
    queryKey: ['folders', initialFolder.id],
    queryFn: () => getFolders(initialFolder.id),
  });

  const { mutateAsync: mutateCreateFolder } = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string }) =>
      createFolder(name, parentId),
  });

  const { mutateAsync: mutateUpdateFolder } = useMutation({
    mutationFn: ({
      id,
      name,
      parentId,
    }: {
      id: string;
      name: string;
      parentId: string;
    }) => updateFolder(id, name, parentId),
  });

  const { mutateAsync: mutateDeleteFolder } = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
  });

  const handleCreateFolder = async () => {
    const name = prompt('Nhập tên thư mục:');
    if (name) {
      await mutateCreateFolder({ name, parentId: initialFolder.id });
      await refetch();
    }
  };

  const handleUpdateFolder = async (id: string) => {
    const name = prompt('Nhập tên thư mục:');
    if (name) {
      await mutateUpdateFolder({
        id,
        name,
        parentId: initialFolder.id,
      });
      await refetch();
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn xóa thư mục này không?'
    );
    if (confirm) {
      await mutateDeleteFolder(id);
      await refetch();
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-2">
        <Button
          as={Link}
          href={`/folders/${initialFolder.parentId}`}
          isIconOnly
          isDisabled={!initialFolder.parentId}
        >
          <ArrowLeftIcon size={16} />
        </Button>
        <Button color="primary" onPress={handleCreateFolder}>
          Tạo thư mục mới
        </Button>
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
                <span className="text-gray-500 cursor-pointer active:opacity-50">
                  <UsersIcon size={16} />
                </span>
                <span
                  className="text-primary cursor-pointer active:opacity-50"
                  onClick={() => handleUpdateFolder(item.id)}
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
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {initialFolder.parentId && <DocumentList folderId={initialFolder.id} />}
    </div>
  );
}
