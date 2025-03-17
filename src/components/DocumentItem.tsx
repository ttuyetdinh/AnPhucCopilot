"use client";

interface DocumentItemProps {
  fileName: string;
  onDelete: () => void;
}

export default function DocumentItem({
  fileName,
  onDelete,
}: DocumentItemProps) {
  return (
    <div className="border-b py-2 flex justify-between">
      <div>{fileName}</div>
      <button className="text-red-500 cursor-pointer" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
