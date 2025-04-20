'use client';

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { createFolder, updateFolder } from '@/app/actions';
import { FolderWithGroupPermissions } from '@/types';

export default function FolderForm({
  parentId,
  initialFolder,
  isOpen,
  onOpenChange,
}: {
  parentId: string;
  initialFolder?: FolderWithGroupPermissions;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [values, setValues] = useState({
    name: initialFolder?.name || '',
  });

  const { isPending: isCreating, mutateAsync: mutateCreateFolder } =
    useMutation({
      mutationFn: ({ name }: { name: string }) => createFolder(name, parentId),
    });

  const { isPending: isUpdating, mutateAsync: mutateUpdateFolder } =
    useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        updateFolder(id, name, parentId),
    });

  const handleSubmit = async (onClose: () => void) => {
    if (initialFolder) {
      await mutateUpdateFolder({
        id: initialFolder.id,
        name: values.name,
      });
    } else {
      await mutateCreateFolder({
        name: values.name,
      });
    }

    onClose();
  };

  const groupedPermissions = initialFolder?.groupPermissions?.reduce(
    (acc, item) => {
      if (!acc[item.group.id]) {
        acc[item.group.id] = {
          id: item.group.id,
          groupName: item.group.name,
          permissions: [],
        };
      }
      acc[item.group.id].permissions.push(item.permission);
      return acc;
    },
    {} as Record<
      string,
      { id: string; groupName: string; permissions: string[] }
    >
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {initialFolder ? 'Chỉnh sửa thư mục' : 'Tạo thư mục mới'}
            </ModalHeader>
            <ModalBody>
              <Input
                label="Tên thư mục"
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
              {groupedPermissions && (
                <Table shadow="none" classNames={{ wrapper: 'px-0' }}>
                  <TableHeader>
                    <TableColumn key="name">Tên nhóm</TableColumn>
                    <TableColumn key="permissions">Các quyền</TableColumn>
                  </TableHeader>
                  <TableBody
                    items={Object.values(groupedPermissions || {})}
                    emptyContent={<div>Chưa có nhóm nào.</div>}
                  >
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.groupName}</TableCell>
                        <TableCell>{item.permissions.join(', ')}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Đóng
              </Button>
              <Button
                color="primary"
                onPress={() => handleSubmit(onClose)}
                isLoading={isCreating || isUpdating}
              >
                Lưu
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
