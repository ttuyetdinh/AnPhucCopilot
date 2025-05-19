import { redirect } from 'next/navigation';

import { getFolderById } from '@/app/actions';
import FolderList from '@/components/FolderList';

export const dynamic = 'force-dynamic';

export default async function FoldersPage({ params }: { params: { id: string } }) {
  // Await the params object before accessing id
  const resolvedParams = await params;
  const folder = await getFolderById(resolvedParams.id);
  if (!folder) {
    return redirect('/folders');
  }

  return <FolderList initialFolder={folder} isRoot={false} />;
}
