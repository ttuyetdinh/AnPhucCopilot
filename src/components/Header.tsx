'use client';

import { SignedIn, UserButton } from '@clerk/nextjs';
import { Tab, Tabs } from '@heroui/react';
import { usePathname, useRouter } from 'next/navigation';

interface HeaderProps {
  isAdmin: boolean;
}

export default function Header({ isAdmin }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (key: string) => {
    switch (key) {
      case 'documents':
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
    <div className="flex items-center justify-between py-4">
      <Tabs onSelectionChange={(k) => handleChange(k.toString())}>
        <Tab key="chat" title="Trò chuyện" />
        <Tab key="documents" title="Tài liệu" />
        {isAdmin && <Tab key="groups" title="Nhóm" />}
      </Tabs>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
