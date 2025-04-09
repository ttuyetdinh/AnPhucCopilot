'use client';

import { DocumentVersion } from '@prisma/client';

interface DocumentItemProps {
  fileName: string;
  versions: DocumentVersion[];
  onDownload: () => void;
  onDelete: () => void;
}

export default function DocumentItem({
  fileName,
  versions,
  onDownload,
  onDelete,
}: DocumentItemProps) {
  return (
    <div className="flex justify-between border-b py-2">
      <div>{fileName}</div>
      <div>{versions[0].version}</div>
      <div className="flex gap-2">
        <button className="cursor-pointer text-blue-500" onClick={onDownload}>
          Tải xuống
        </button>
        <button className="cursor-pointer text-red-500" onClick={onDelete}>
          Xóa
        </button>
      </div>
    </div>
  );
}
