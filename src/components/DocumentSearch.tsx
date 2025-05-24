'use client';

import { Card, CardBody, Input, Spinner } from '@heroui/react';
import { FolderPermission } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { ExternalLinkIcon, SearchIcon } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { searchDocuments } from '@/app/actions';
import { DocumentWithVersions, FolderWithGroupPermissions } from '@/types';

type SearchDocumentResult = DocumentWithVersions & {
  folder: FolderWithGroupPermissions;
  userPermissions: FolderPermission;
};

export default function DocumentSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [results, setResults] = useState<SearchDocumentResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const { isPending, mutateAsync: performSearch } = useMutation({
    mutationFn: (term: string) => searchDocuments(term),
    onSuccess: (data) => {
      setResults(data as SearchDocumentResult[]);
      setShowResults(true);
    },
  });

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      performSearch(debouncedSearchTerm);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchTerm, performSearch]);
  const handleDocumentClick = (document: SearchDocumentResult) => {
    // Navigate to the folder containing the document
    if (document.folder.isRoot) {
      router.push('/folders');
    } else {
      router.push(`/folders/${document.folderId}`);
    }
    setSearchTerm('');
    setShowResults(false);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => setShowResults(false), 200);
  };
  return (
    <div className="relative w-full max-w-md">
      <div className="w-96">
        <Input
          isClearable
          placeholder="Tìm kiếm tài liệu..."
          startContent={<SearchIcon size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onClear={() => {
            setSearchTerm('');
            setResults([]);
            setShowResults(false);
          }}
        />
      </div>

      {showResults && (searchTerm.trim() || isPending) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardBody className="p-2">
            {isPending ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
                <span className="ml-2 text-sm">Đang tìm kiếm...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.slice(0, 3).map((document) => (
                  <div
                    key={document.id}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-md transition-colors"
                    onClick={() => handleDocumentClick(document)}
                  >
                    <div className="font-medium text-sm">{document.fileName}</div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <span>Trong thư mục: {document.folder.name}</span>
                      <span>•</span>
                      <span>Phiên bản: {document.versions[0]?.version || 1}</span>
                    </div>
                    <div className="text-xs text-gray-400">{document.createdAt.toLocaleString('vi-VN')}</div>{' '}
                  </div>
                ))}
                {results.length > 3 && (
                  <div className="p-2 border-t">
                    <NextLink href={`/search?q=${encodeURIComponent(searchTerm)}`}>
                      <div className="text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer py-1 flex items-center justify-center space-x-1">
                        <span>Xem tất cả {results.length} kết quả</span>
                        <ExternalLinkIcon size={14} />
                      </div>
                    </NextLink>
                  </div>
                )}
              </div>
            ) : searchTerm.trim() ? (
              <div className="text-center py-4 text-sm text-gray-500">Không tìm thấy tài liệu nào</div>
            ) : null}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
