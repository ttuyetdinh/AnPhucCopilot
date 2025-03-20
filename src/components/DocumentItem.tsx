'use client';

interface DocumentItemProps {
  fileName: string;
  onDelete: () => void;
}

export default function DocumentItem({
  fileName,
  onDelete,
}: DocumentItemProps) {
  return (
    <div className="flex justify-between border-b py-2">
      <div>{fileName}</div>
      <button className="cursor-pointer text-red-500" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
