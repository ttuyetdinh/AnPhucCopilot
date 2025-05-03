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
import { EditIcon, TrashIcon } from 'lucide-react';
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
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<string | undefined>();
  const [selectedPermission, setSelectedPermission] = useState<
    FolderPermission | undefined
  >(undefined);

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
    isPending: isAddOrEditFolderPermission,
    mutateAsync: mutateAddOrEditFolderPermission,
  } = useMutation({
    mutationFn: ({
      folderId,
      groupId,
      permission,
    }: {
      folderId: string;
      groupId: string;
      permission: FolderPermission;
    }) => addGroupToFolder(folderId, groupId, permission),
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
    if (!selectedGroup || !selectedPermission) {
      return;
    }

    try {
      await mutateAddOrEditFolderPermission({
        folderId,
        groupId: selectedGroup,
        permission: selectedPermission,
      });
      await refetch();

      setIsAddGroupModalOpen(false);
      setSelectedGroup(undefined);
      setSelectedPermission(undefined);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handleEditFolderPermission = async () => {
    if (!selectedPermission || !selectedGroup) {
      return;
    }

    try {
      await mutateAddOrEditFolderPermission({
        folderId,
        groupId: selectedGroup,
        permission: selectedPermission,
      });
      await refetch();

      setIsEditGroupModalOpen(false);
      setSelectedPermission(undefined);
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

  const getPermissionName = (permission: string) => {
    switch (permission) {
      case FolderPermission.FULL_ACCESS:
        return 'Full access';
      case FolderPermission.READ_ONLY:
        return 'Read only';
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
                        isAddOrEditFolderPermission ||
                        isRemoveFolderPermission
                      }
                      isLoading={
                        isLoading ||
                        isAddOrEditFolderPermission ||
                        isRemoveFolderPermission
                      }
                    >
                      Thêm nhóm
                    </Button>
                  </div>
                  <Table shadow="none" classNames={{ wrapper: 'p-0' }}>
                    <TableHeader>
                      <TableColumn key="name">Tên nhóm</TableColumn>
                      <TableColumn key="permissions">Quyền</TableColumn>
                      <TableColumn key="actions" align="end" width={100}>
                        Hành động
                      </TableColumn>
                    </TableHeader>
                    <TableBody
                      isLoading={isLoading}
                      items={data?.groupPermissions || []}
                      emptyContent={<div>Chưa có nhóm nào.</div>}
                    >
                      {(item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.group.name}</TableCell>
                          <TableCell>
                            {getPermissionName(item.permission)}
                          </TableCell>
                          <TableCell className="flex items-center space-x-2 justify-end">
                            <span
                              className="text-primary cursor-pointer active:opacity-50"
                              onClick={() => {
                                setIsEditGroupModalOpen(true);

                                setSelectedPermission(item.permission);
                                setSelectedGroup(item.groupId);
                              }}
                            >
                              <EditIcon size={16} />
                            </span>
                            <span
                              className="text-danger cursor-pointer active:opacity-50"
                              onClick={() =>
                                handleRemoveFolderPermission(item.groupId)
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
                  {(groups || [])
                    .filter(
                      (group) =>
                        !data?.groupPermissions.some(
                          (permission) => permission.groupId === group.id
                        )
                    )
                    .map((group) => (
                      <SelectItem key={group.id}>{group.name}</SelectItem>
                    ))}
                </Select>
                <Select
                  label="Chọn quyền"
                  placeholder="Chọn quyền"
                  selectedKeys={selectedPermission ? [selectedPermission] : []}
                  onChange={(e) => {
                    setSelectedPermission(e.target.value as FolderPermission);
                  }}
                >
                  {[
                    FolderPermission.READ_ONLY,
                    FolderPermission.FULL_ACCESS,
                  ].map((permission) => (
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
                  isLoading={isAddOrEditFolderPermission}
                  isDisabled={!selectedGroup || !selectedPermission}
                >
                  Thêm
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isEditGroupModalOpen}
        onOpenChange={setIsEditGroupModalOpen}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Sửa quyền</ModalHeader>
              <ModalBody>
                <Select
                  label="Chọn quyền"
                  placeholder="Chọn quyền"
                  selectedKeys={selectedPermission ? [selectedPermission] : []}
                  onChange={(e) => {
                    setSelectedPermission(e.target.value as FolderPermission);
                  }}
                >
                  {[
                    FolderPermission.READ_ONLY,
                    FolderPermission.FULL_ACCESS,
                  ].map((permission) => (
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
                  onPress={handleEditFolderPermission}
                  isLoading={isAddOrEditFolderPermission}
                  isDisabled={!selectedPermission}
                >
                  Sửa
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
