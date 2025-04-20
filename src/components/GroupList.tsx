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
import { Group, GroupMember } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';

import { deleteGroup, getGroups } from '@/app/actions';

import GroupForm from './GroupForm';

export default function GroupList() {
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<
    (Group & { members: GroupMember[] }) | undefined
  >(undefined);

  const { isLoading, data, refetch } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  });

  const { mutateAsync: mutateDeleteGroup } = useMutation({
    mutationFn: (id: string) => deleteGroup(id),
  });

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Bạn có chắc chắn muốn xóa nhóm này không?');
    if (confirm) {
      await mutateDeleteGroup(id);
      await refetch();
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex">
        <Button color="primary" onPress={() => setIsGroupFormOpen(true)}>
          Tạo nhóm mới
        </Button>
      </div>
      <Table shadow="none">
        <TableHeader>
          <TableColumn key="name">Tên</TableColumn>
          <TableColumn key="description">Mô tả</TableColumn>
          <TableColumn key="actions" align="end" width={200}>
            Hành động
          </TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          items={data || []}
          loadingContent={<Spinner label="Đang tải nhóm..." />}
          emptyContent={<div>Không có nhóm nào.</div>}
        >
          {(item) => (
            <TableRow key={item.name}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.description || '-'}</TableCell>
              <TableCell className="flex items-center space-x-2 justify-end">
                <span
                  className="text-primary cursor-pointer active:opacity-50"
                  onClick={() => {
                    setSelectedGroup(item);
                    setIsGroupFormOpen(true);
                  }}
                >
                  <PencilIcon size={16} />
                </span>
                <span
                  className="text-danger cursor-pointer active:opacity-50"
                  onClick={() => handleDelete(item.id)}
                >
                  <TrashIcon size={16} />
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <GroupForm
        key={selectedGroup?.id || new Date().toISOString()}
        initialGroup={selectedGroup}
        isOpen={isGroupFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedGroup(undefined);
          }
          setIsGroupFormOpen(isOpen);

          refetch();
        }}
      />
    </div>
  );
}
