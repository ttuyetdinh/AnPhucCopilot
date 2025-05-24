import { Suspense } from 'react';

import DocumentSearchResults from '@/components/DocumentSearchResults';

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Tìm kiếm tài liệu</h1>
      <Suspense fallback={<div>Đang tải...</div>}>
        <DocumentSearchResults />
      </Suspense>
    </div>
  );
}
