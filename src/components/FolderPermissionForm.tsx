'use client';

import {
  Button,
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
import { FolderPermission } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { TrashIcon } from 'lucide-react';
import { useState } from 'react';

import {
  addGroupToFolder,
  getFolderById,
  getGroups,
  removeGroupFromFolder,
} from '@/app/actions';

interface FolderPermissionFormProps {
  folderId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function FolderPermissionForm({
  folderId,
  isOpen,
  onOpenChange,
}: FolderPermissionFormProps) {
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<
    FolderPermission[]
  >([]);

  const {
    isLoading: isLoadingFolder,
    data,
    refetch,
  } = useQuery({
    queryKey: ['folders', folderId],
    queryFn: () => getFolderById(folderId),
  });

  const { isLoading: isLoadingGroups, data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  });

  const {
    isPending: isAddFolderPermission,
    mutateAsync: mutateAddFolderPermission,
  } = useMutation({
    mutationFn: ({
      folderId,
      groupId,
      permissions,
    }: {
      folderId: string;
      groupId: string;
      permissions: FolderPermission[];
    }) => addGroupToFolder(folderId, groupId, permissions),
  });

  const {
    isPending: isRemoveFolderPermission,
    mutateAsync: mutateRemoveFolderPermission,
  } = useMutation({
    mutationFn: ({
      folderId,
      groupId,
    }: {
      folderId: string;
      groupId: string;
    }) => removeGroupFromFolder(folderId, groupId),
  });

  const handleAddFolderPermission = async () => {
    if (!selectedGroup || selectedPermissions.length === 0) {
      return;
    }

    try {
      await mutateAddFolderPermission({
        folderId,
        groupId: selectedGroup,
        permissions: selectedPermissions,
      });
      await refetch();

      setIsAddGroupModalOpen(false);
      setSelectedGroup('');
      setSelectedPermissions([]);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handleRemoveFolderPermission = async (groupId: string) => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn xóa nhóm này khỏi thư mục?'
    );
    if (!confirm) return;

    await mutateRemoveFolderPermission({
      folderId,
      groupId,
    });
    await refetch();
  };

  const isLoading = isLoadingFolder || isLoadingGroups;

  const groupedPermissions = data?.groupPermissions?.reduce(
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

  const getPermissionName = (permission: string) => {
    switch (permission) {
      case 'CREATE':
        return 'Tạo';
      case 'VIEW':
        return 'Xem';
      case 'EDIT':
        return 'Sửa';
      case 'REMOVE':
        return 'Xóa';
      default:
        return permission;
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Phân quyền thư mục</ModalHeader>
              <ModalBody>
                <div className="flex flex-col space-y-2">
                  <div className="flex">
                    <Button
                      color="primary"
                      onPress={() => setIsAddGroupModalOpen(true)}
                      isDisabled={
                        !groups ||
                        groups.length === 0 ||
                        isAddFolderPermission ||
                        isRemoveFolderPermission
                      }
                      isLoading={
                        isLoading ||
                        isAddFolderPermission ||
                        isRemoveFolderPermission
                      }
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
                      isLoading={isLoading}
                      items={Object.values(groupedPermissions || {})}
                      emptyContent={<div>Chưa có nhóm nào.</div>}
                    >
                      {(item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.groupName}</TableCell>
                          <TableCell>
                            {item.permissions
                              .map((permission) =>
                                getPermissionName(permission)
                              )
                              .join(', ')}
                          </TableCell>
                          <TableCell className="flex items-center space-x-2 justify-end">
                            <span
                              className="text-danger cursor-pointer active:opacity-50"
                              onClick={() =>
                                handleRemoveFolderPermission(item.id)
                              }
                            >
                              <TrashIcon size={16} />
                            </span>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                  isDisabled={isLoadingGroups}
                >
                  {(groups || []).map((group) => (
                    <SelectItem key={group.id}>{group.name}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="Chọn quyền"
                  placeholder="Chọn quyền"
                  selectedKeys={selectedPermissions}
                  onChange={(e) => {
                    setSelectedPermissions(
                      e.target.value
                        .trim()
                        .split(',')
                        .filter((permission) => permission !== '')
                        .map((permission) => permission as FolderPermission)
                    );
                  }}
                  selectionMode="multiple"
                >
                  {Object.values(FolderPermission).map((permission) => (
                    <SelectItem key={permission}>
                      {getPermissionName(permission)}
                    </SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button
                  color="primary"
                  onPress={handleAddFolderPermission}
                  isLoading={isAddFolderPermission}
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
