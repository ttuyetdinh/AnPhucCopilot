'use client';

import { SignedIn, UserButton } from '@clerk/nextjs';
import { Tab, Tabs } from '@heroui/react';
import { usePathname, useRouter } from 'next/navigation';

import { useRootStore } from '@/stores';

export default function Header() {
  const isAdmin = useRootStore((state) => state.isAdmin);

  const router = useRouter();
  const pathname = usePathname();

  const getSelectedKey = () => {
    if (pathname.includes('/conversations/')) {
      return '/';
    }

    return pathname.split('/')[1];
  };

  const handleChange = (key: string) => {
    switch (key) {
      case 'folders':
        router.push('/folders');
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
      <Tabs
        defaultSelectedKey={getSelectedKey()}
        onSelectionChange={(k) => handleChange(k.toString())}
      >
        <Tab key="chat" title="Trò chuyện" />
        <Tab key="folders" title="Tài liệu" />
        {isAdmin && <Tab key="groups" title="Nhóm" />}
      </Tabs>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
