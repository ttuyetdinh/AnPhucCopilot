'use client';

import { SignedIn, UserButton } from '@clerk/nextjs';
import { Tab, Tabs } from '@heroui/react';
import { usePathname, useRouter } from 'next/navigation';

import { useRootStore } from '@/stores';

import DocumentSearch from './DocumentSearch';

export default function Header() {
  const isAdmin = useRootStore((state) => state.isAdmin);

  const router = useRouter();
  const pathname = usePathname();
  const getSelectedKey = () => {
    if (pathname.includes('/conversations/')) {
      return '/';
    }

    if (pathname.includes('/search')) {
      return 'search';
    }

    return pathname.split('/')[1];
  };
  const handleChange = (key: string) => {
    switch (key) {
      case 'folders':
        router.push('/folders');
        break;

      case 'search':
        router.push('/search');
        break;

      case 'groups':
        router.push('/groups');
        break;

      default:
        if (!pathname.includes('/conversations/')) {
          router.push('/');
        }
        break;
    }
  };
  return (
    <div className="flex items-center justify-between pb-4">
      <Tabs defaultSelectedKey={getSelectedKey()} onSelectionChange={(k) => handleChange(k.toString())}>
        <Tab key="chat" title="Trò chuyện" />
        <Tab key="folders" title="Tài liệu" />
        <Tab key="search" title="Tìm kiếm" />
        {isAdmin && <Tab key="groups" title="Nhóm" />}
      </Tabs>
      <div className="flex items-center space-x-4">
        {(pathname.includes('/folders') || pathname.includes('/search') || pathname === '/') && <DocumentSearch />}
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  );
}
