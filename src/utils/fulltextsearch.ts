import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const fullTextSearch = async (
  query: string,
  options?: {
    limit?: number;
    language?: string;
  }
): Promise<string[]> => {
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

  const searchQuery = Prisma.sql`SELECT id, content, document_id AS "documentId", 
							ts_rank(search_vector, to_tsquery(${language}::regconfig, ${searchTerm})) AS rank
				FROM document_chunks
				WHERE search_vector @@ to_tsquery(${language}::regconfig, ${searchTerm})
				ORDER BY rank DESC
				LIMIT ${limit};`;

  const result = await prisma.$queryRaw(searchQuery);

  return Array.isArray(result) ? (result as string[]) : [];
};
