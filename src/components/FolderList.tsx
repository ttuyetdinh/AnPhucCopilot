'use client';

import { Folder } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  const { data, refetch } = useQuery<Folder[]>({
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
    <div className="flex flex-col gap-4">
      {initialFolder.parentId && (
        <div className="flex flex-col gap-2 border p-4">
          <Link href={`/folders/${initialFolder.parentId}`}>Trở về trước</Link>
        </div>
      )}
      <button onClick={handleCreateFolder}>Tạo thư mục mới</button>
      {data && data.length > 0 && (
        <div className="flex flex-col gap-2 border p-4">
          {data.map((folder) => (
            <div key={folder.id}>
              <Link href={`/folders/${folder.id}`}>{folder.name}</Link>
              <button onClick={() => handleUpdateFolder(folder.id)}>Sửa</button>
              {!folder.isRoot && (
                <button onClick={() => handleDeleteFolder(folder.id)}>
                  Xóa
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {initialFolder.parentId && <DocumentList folderId={initialFolder.id} />}
    </div>
  );
}
