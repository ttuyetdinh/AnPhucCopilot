import { redirect } from 'next/navigation';

import { getFolderById } from '@/app/actions';
import FolderList from '@/components/FolderList';

export const dynamic = 'force-dynamic';

export default async function FoldersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const folder = await getFolderById(id);
  if (!folder) {
    return redirect('/folders');
  }

  return <FolderList initialFolder={folder} />;
}
