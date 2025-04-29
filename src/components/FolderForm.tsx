'use client';

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
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

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
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
