import { Prisma, PrismaClient } from '@prisma/client';

import { fullTextSearchChunk } from '@/types';

const prisma = new PrismaClient();

/**
 * Performs a full-text search on document chunks using PostgreSQL's full-text search capabilities.
 * The search terms are modified to match any word that starts with the provided terms.
 *
 * @param {string} query - The search query string. It will be split into words and modified to match any word starting with each term.
 * @param {Object} [options] - Optional parameters for the search.
 * @param {number} [options.limit=10] - The maximum number of results to return. Defaults to 10.
 * @param {string} [options.language='english'] - The language configuration for the full-text search. Defaults to 'english'.
 *
 * @returns {Promise<fullTextSearchChunk[]>} A promise that resolves to an array of search result chunks, each containing:
 *   - id: The ID of the chunk.
 *   - content: The content of the chunk.
 *   - documentId: The ID of the document to which the chunk belongs.
 *   - rank: The rank of the chunk based on the search relevance.
 *
 * @example
 * // Example usage:
 * const results = await fullTextSearch("hello world", { limit: 5, language: "english" });
 * // Output:
 * // [
 * //   { id: "chunk1", content: "Hello world example content", documentId: "doc1", rank: 0.8 },
 * //   { id: "chunk2", content: "Another hello world example", documentId: "doc2", rank: 0.75 },
 * //   ...
 * // ]
 *
 * @remarks
 * - **Search Term Modification**: Each word in the query is modified to match any word that starts with it. For example, "hello world" becomes "hello*" & "world*".
 * - **SQL Injection Protection**: The function uses Prisma's sql template tag to safely interpolate variables into the query, protecting against SQL injection attacks.
 * - **PostgreSQL Full-Text Search**: Utilizes PostgreSQL's full-text search capabilities, including the `ts_rank` function for ranking results based on relevance.
 */
export const fullTextSearch = async (
  query: string,
  options?: {
    limit?: number;
    language?: string;
  }
): Promise<fullTextSearchChunk[]> => {
  if (!query) {
    return [];
  }

  const { limit = 10, language = 'english' } = options || {};

  // Sample query: "hello world" -> "hello*" & "world*"
  // This will match any word that starts with "hello" and "world"
  const searchTerm = query
    .trim()
    .split(/\s+/)
    .map((word) => `${word}*`)
    .join(' & ');

  const searchQuery = Prisma.sql`SELECT 
  id, 
  content, 
  document_id AS "documentId", 
  ts_rank(
    search_vector, 
    to_tsquery(
      ${language} :: regconfig, ${searchTerm}
    )
  ) AS rank 
FROM 
  document_chunks 
WHERE 
  search_vector @@ to_tsquery(
    ${language} :: regconfig, ${searchTerm}
  ) 
ORDER BY 
  rank DESC 
LIMIT 
  ${limit};`;

  const result = await prisma.$queryRaw<fullTextSearchChunk[]>(searchQuery);
  return Array.isArray(result) ? result : [];
};
