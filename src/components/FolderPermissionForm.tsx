'use client';

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { TrashIcon } from 'lucide-react';
import { useState } from 'react';

import {
  addGroupToFolder,
  getGroups,
  removeGroupFromFolder,
} from '@/app/actions';
import { FolderWithGroupPermissions } from '@/types';

export default function FolderPermissionForm({
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

  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: groups, refetch: refetchGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
    enabled: isOpen,
  });

  const { isPending: isAddingGroup, mutateAsync: mutateAddGroupToFolder } =
    useMutation({
      mutationFn: ({
        folderId,
        groupId,
        permissions,
      }: {
        folderId: string;
        groupId: string;
        permissions: string[];
      }) => addGroupToFolder(folderId, groupId, permissions),
    });

  const {
    isPending: isRemovingGroup,
    mutateAsync: mutateRemoveGroupFromFolder,
  } = useMutation({
    mutationFn: ({
      folderId,
      groupId,
    }: {
      folderId: string;
      groupId: string;
    }) => removeGroupFromFolder(folderId, groupId),
  });

  const handleSubmit = async () => {
    if (!initialFolder || !selectedGroup || selectedPermissions.length === 0)
      return;

    await mutateAddGroupToFolder({
      folderId: initialFolder.id,
      groupId: selectedGroup,
      permissions: selectedPermissions,
    });

    setIsAddGroupModalOpen(false);
    setSelectedGroup('');
    setSelectedPermissions([]);
  };

  const handleRemoveGroup = async (groupId: string) => {
    if (!initialFolder) return;
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn xóa nhóm này khỏi thư mục?'
    );
    if (!confirm) return;

    await mutateRemoveGroupFromFolder({
      folderId: initialFolder.id,
      groupId,
    });
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

  const availableGroups = (groups || []).filter(
    (group) => !groupedPermissions || !groupedPermissions[group.id]
  );

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {initialFolder ? 'Phân quyền thư mục' : 'Tạo thư mục mới'}
              </ModalHeader>
              <ModalBody>
                {initialFolder ? (
                  <div className="flex flex-col space-y-2">
                    <Input
                      label="Tên thư mục"
                      value={values.name}
                      onChange={(e) =>
                        setValues({ ...values, name: e.target.value })
                      }
                      className="mb-4"
                    />
                    <div className="flex">
                      <Button
                        color="primary"
                        onPress={() => setIsAddGroupModalOpen(true)}
                        isDisabled={availableGroups.length === 0}
                      >
                        Thêm nhóm
                      </Button>
                    </div>
                    <Table shadow="none" classNames={{ wrapper: 'p-0' }}>
                      <TableHeader>
                        <TableColumn key="name">Tên nhóm</TableColumn>
                        <TableColumn key="permissions">Các quyền</TableColumn>
                        <TableColumn key="actions" align="end" width={100}>
                          Hành động
                        </TableColumn>
                      </TableHeader>
                      <TableBody
                        items={Object.values(groupedPermissions || {})}
                        emptyContent={<div>Chưa có nhóm nào.</div>}
                      >
                        {(item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.groupName}</TableCell>
                            <TableCell>{item.permissions.join(', ')}</TableCell>
                            <TableCell>
                              <span
                                className="text-danger cursor-pointer active:opacity-50"
                                onClick={() => handleRemoveGroup(item.id)}
                              >
                                <TrashIcon size={16} />
                              </span>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Input
                      label="Tên thư mục"
                      value={values.name}
                      onChange={(e) =>
                        setValues({ ...values, name: e.target.value })
                      }
                    />
                    <p className="text-sm text-gray-500">
                      Bạn có thể phân quyền cho thư mục sau khi tạo.
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Đóng
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isAddGroupModalOpen}
        onOpenChange={setIsAddGroupModalOpen}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Thêm nhóm người dùng</ModalHeader>
              <ModalBody>
                <Select
                  label="Chọn nhóm"
                  placeholder="Chọn nhóm người dùng"
                  selectedKeys={selectedGroup ? [selectedGroup] : []}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  {availableGroups.map((group) => (
                    <SelectItem key={group.id}>{group.name}</SelectItem>
                  ))}
                </Select>
                <CheckboxGroup
                  label="Chọn quyền"
                  orientation="horizontal"
                  value={selectedPermissions}
                  onChange={(values) =>
                    setSelectedPermissions(values as string[])
                  }
                >
                  <Checkbox value="VIEW">Xem</Checkbox>
                  <Checkbox value="CREATE">Tạo mới</Checkbox>
                  <Checkbox value="EDIT">Chỉnh sửa</Checkbox>
                  <Checkbox value="REMOVE">Xóa</Checkbox>
                </CheckboxGroup>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isAddingGroup}
                  isDisabled={
                    !selectedGroup || selectedPermissions.length === 0
                  }
                >
                  Thêm
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
