'use client';

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { createGroup, getClerkUsers, updateGroup } from '@/app/actions';
import { GroupWithMembers } from '@/types';

export default function GroupForm({
  initialGroup,
  isOpen,
  onOpenChange,
}: {
  initialGroup?: GroupWithMembers;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [values, setValues] = useState({
    name: initialGroup?.name || '',
    description: initialGroup?.description || '',
    clerkIds: (initialGroup?.members || []).map((member) => member.clerkId),
  });

  const { isLoading, data } = useQuery({
    queryKey: ['clerkUsers'],
    queryFn: () => getClerkUsers(),
  });

  const { isPending: isCreating, mutateAsync: mutateCreateGroup } = useMutation(
    {
      mutationFn: ({
        name,
        description,
        clerkIds,
      }: {
        name: string;
        description: string;
        clerkIds: string[];
      }) => createGroup(name, description, clerkIds),
    }
  );

  const { isPending: isUpdating, mutateAsync: mutateUpdateGroup } = useMutation(
    {
      mutationFn: ({
        id,
        name,
        description,
        clerkIds,
      }: {
        id: string;
        name: string;
        description: string;
        clerkIds: string[];
      }) => updateGroup(id, name, description, clerkIds),
    }
  );

  const handleSubmit = async (onClose: () => void) => {
    if (initialGroup) {
      await mutateUpdateGroup({
        id: initialGroup.id,
        name: values.name,
        description: values.description,
        clerkIds: values.clerkIds,
      });
    } else {
      await mutateCreateGroup({
        name: values.name,
        description: values.description,
        clerkIds: values.clerkIds,
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
              {initialGroup ? 'Chỉnh sửa nhóm' : 'Tạo nhóm mới'}
            </ModalHeader>
            <ModalBody>
              <Input
                label="Tên nhóm"
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
              <Textarea
                label="Mô tả"
                placeholder="Mô tả nhóm"
                value={values.description}
                onChange={(e) =>
                  setValues({ ...values, description: e.target.value })
                }
              />
              <Select
                label="Người dùng"
                placeholder="Chọn người dùng"
                selectionMode="multiple"
                isLoading={isLoading}
                selectedKeys={values.clerkIds}
                onChange={(e) =>
                  setValues({
                    ...values,
                    clerkIds: e.target.value
                      .trim()
                      .split(',')
                      .filter((id) => id !== ''),
                  })
                }
              >
                {(data || []).map((user) => (
                  <SelectItem key={user.id}>{user.email}</SelectItem>
                ))}
              </Select>
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
