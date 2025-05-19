import FolderList from '@/components/FolderList';

import { getRootFolder } from '../actions';

export const dynamic = 'force-dynamic';

export default async function FoldersPage() {
  const folder = await getRootFolder();

  return <FolderList initialFolder={folder} isRoot={true} />;
}
