'use client';

import { Button, Checkbox, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { createFolder, updateFolder } from '@/app/actions';
import { FolderWithUserPermissions } from '@/types';

export default function FolderForm({
  parentId,
  initialFolder,
  isOpen,
  onOpenChange,
}: {
  parentId: string;
  initialFolder?: FolderWithUserPermissions;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [values, setValues] = useState({
    name: initialFolder?.name || '',
    isPermissionInherited: initialFolder?.isPermissionInherited ?? true,
  });

  const { isPending: isCreating, mutateAsync: mutateCreateFolder } = useMutation({
    mutationFn: ({ name, isPermissionInherited }: { name: string; isPermissionInherited: boolean }) =>
      createFolder(name, parentId, isPermissionInherited),
  });

  const { isPending: isUpdating, mutateAsync: mutateUpdateFolder } = useMutation({
    mutationFn: ({ id, name, isPermissionInherited }: { id: string; name: string; isPermissionInherited: boolean }) =>
      updateFolder(id, name, parentId, isPermissionInherited),
  });

  const handleSubmit = async (onClose: () => void) => {
    if (initialFolder) {
      await mutateUpdateFolder({
        id: initialFolder.id,
        name: values.name,
        isPermissionInherited: values.isPermissionInherited,
      });
    } else {
      await mutateCreateFolder({
        name: values.name,
        isPermissionInherited: values.isPermissionInherited,
      });
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{initialFolder ? 'Chỉnh sửa thư mục' : 'Tạo thư mục mới'}</ModalHeader>
            <ModalBody>
              <Input
                label="Tên thư mục"
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
              <Checkbox
                isSelected={values.isPermissionInherited}
                onChange={(e) =>
                  setValues({
                    ...values,
                    isPermissionInherited: e.target.checked,
                  })
                }
                className="mt-4"
              >
                Inherited permissions from parent folder
              </Checkbox>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Đóng
              </Button>
              <Button color="primary" onPress={() => handleSubmit(onClose)} isLoading={isCreating || isUpdating}>
                Lưu
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
