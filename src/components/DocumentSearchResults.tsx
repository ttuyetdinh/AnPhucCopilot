'use client';

import { Card, CardBody, Chip, Input, Pagination, Spinner } from '@heroui/react';
import { FolderPermission } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { CalendarIcon, FileIcon, FolderIcon, SearchIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { getRecentDocuments, searchDocuments } from '@/app/actions';
import { DocumentWithVersions, FolderWithGroupPermissions } from '@/types';

type SearchDocumentResult = DocumentWithVersions & {
  folder: FolderWithGroupPermissions;
  userPermissions: FolderPermission;
};

export default function DocumentSearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [results, setResults] = useState<SearchDocumentResult[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<SearchDocumentResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { isPending, mutateAsync: performSearch } = useMutation({
    mutationFn: (term: string) => searchDocuments(term),
    onSuccess: (data) => {
      setResults(data as SearchDocumentResult[]);
      setCurrentPage(1);
    },
  });

  const { isPending: isLoadingRecent, mutateAsync: loadRecentDocuments } = useMutation({
    mutationFn: () => getRecentDocuments(10),
    onSuccess: (data) => {
      setRecentDocuments(data as SearchDocumentResult[]);
    },
  });

  // Load recent documents on component mount
  useEffect(() => {
    loadRecentDocuments();
  }, [loadRecentDocuments]);

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      performSearch(debouncedSearchTerm);
      // Update URL with search query
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('q', debouncedSearchTerm);
      window.history.replaceState({}, '', newUrl);
    } else {
      setResults([]);
      // Remove query parameter if search is empty
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('q');
      window.history.replaceState({}, '', newUrl);
    }
  }, [debouncedSearchTerm, performSearch]);

  const handleDocumentClick = (document: SearchDocumentResult) => {
    if (document.folder.isRoot) {
      router.push('/folders');
    } else {
      router.push(`/folders/${document.folderId}`);
    }
  };

  const getPermissionColor = (permission: FolderPermission) => {
    switch (permission) {
      case FolderPermission.FULL_ACCESS:
        return 'success';
      case FolderPermission.READ_ONLY:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPermissionText = (permission: FolderPermission) => {
    switch (permission) {
      case FolderPermission.FULL_ACCESS:
        return 'Toàn quyền';
      case FolderPermission.READ_ONLY:
        return 'Chỉ đọc';
      default:
        return 'Không xác định';
    }
  };

  const paginatedResults = results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(results.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Input
          size="lg"
          placeholder="Nhập tên tài liệu để tìm kiếm..."
          startContent={<SearchIcon size={20} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          isClearable
          onClear={() => setSearchTerm('')}
        />
      </div>
      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="ml-3 text-lg">Đang tìm kiếm...</span>
        </div>
      )}
      {searchTerm.trim() && !isPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Kết quả tìm kiếm cho "{searchTerm}"</h2>
            <span className="text-gray-500">{results.length} tài liệu được tìm thấy</span>
          </div>

          {results.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <FileIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Không tìm thấy tài liệu nào</h3>
                <p className="text-gray-500">
                  Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra lại quyền truy cập của bạn
                </p>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedResults.map((document) => (
                  <Card key={document.id} isHoverable>
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => handleDocumentClick(document)}>
                          <div className="flex items-center space-x-2 mb-2">
                            <FileIcon size={20} className="text-blue-500" />
                            <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                              {document.fileName}
                            </h3>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                              <FolderIcon size={16} />
                              <span>Thư mục: {document.folder.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CalendarIcon size={16} />
                              <span>{document.createdAt.toLocaleString('vi-VN')}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Chip size="sm" variant="flat">
                              Phiên bản {document.versions[0]?.version || 1}
                            </Chip>
                            <Chip size="sm" color={getPermissionColor(document.userPermissions)} variant="flat">
                              {getPermissionText(document.userPermissions)}
                            </Chip>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} showControls showShadow />
                </div>
              )}
            </>
          )}
        </div>
      )}
      {!searchTerm.trim() && !isPending && (
        <div className="space-y-6">
          <Card>
            <CardBody className="text-center py-8">
              <SearchIcon size={48} className="mx-auto text-gray-400 mb-4" />{' '}
              <h3 className="text-lg font-medium text-gray-600 mb-2">Tìm kiếm tài liệu</h3>
              <p className="text-gray-500 mb-4">Nhập tên tài liệu hoặc thư mục vào ô tìm kiếm để bắt đầu</p>
            </CardBody>
          </Card>

          {/* Recent Documents Section */}
          {recentDocuments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tài liệu gần đây</h2>{' '}
              <div className="space-y-3">
                {recentDocuments.map((document) => (
                  <Card key={document.id} isHoverable>
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => handleDocumentClick(document)}>
                          <div className="flex items-center space-x-2 mb-2">
                            <FileIcon size={20} className="text-blue-500" />
                            <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                              {document.fileName}
                            </h3>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                              <FolderIcon size={16} />
                              <span>Thư mục: {document.folder.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CalendarIcon size={16} />
                              <span>{document.createdAt.toLocaleString('vi-VN')}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Chip size="sm" variant="flat">
                              Phiên bản {document.versions[0]?.version || 1}
                            </Chip>
                            <Chip size="sm" color={getPermissionColor(document.userPermissions)} variant="flat">
                              {getPermissionText(document.userPermissions)}
                            </Chip>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
