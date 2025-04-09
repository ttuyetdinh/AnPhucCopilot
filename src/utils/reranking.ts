import { RankingChunk, RankingChunksWithWeight } from '@/types';

/**
 * Reranks a list of document chunks from multiple sources using a weighted linear combination
 * with a neutral score approach for missing chunks. Each source provides a set of chunks with
 * scores, and a weight is assigned to each source. The final score for each chunk is computed
 * as a weighted average, where missing scores in a source are replaced with the source's
 * average score (neutral score). Recommend: The weights across all sources must sum to 1 to ensure
 * the final scores are normalized between 0 and 1 (assuming input scores are 0-1).
 *
 * @param {...RankingChunksWithWeight[]} chunksWithWeight - A variable number of objects,
 * each containing an array of chunks and a weight for that source.
 * @param {RankingChunksWithWeight} chunksWithWeight[] - Each object has:
 *   @param {RankingChunk[]} chunks - Array of chunks, where each chunk has an `id` (string)
 *     and a `score`.
 *   @param {number} weight - The weight assigned to this source (e.g., 0.6)
 *
 * @returns {RankingChunk[]} An array of reranked chunks, each with an `id` and a final `score`,
 * sorted in descending order by score. The final score is the weighted average of actual and
 * neutral scores across all sources.
 *
 * @example
 * const fullTextChunks = [
 *   { id: "chunk1", score: 0.8 },
 *   { id: "chunk2", score: 0.7 },
 * ];
 * const vectorChunks = [
 *   { id: "chunk2", score: 0.9 },
 *   { id: "chunk3", score: 0.7 },
 * ];
 * const reranked = reRankingChunk(
 *   { chunks: fullTextChunks, weight: 0.6 },
 *   { chunks: vectorChunks, weight: 0.4 }
 * );
 * // Output:
 * // [
 * //   { id: "chunk1", score: 0.80 }, // (0.8 * 0.6 + 0.8 * 0.4) / (0.6 + 0.4)
 * //   { id: "chunk2", score: 0.78 }, // (0.7 * 0.6 + 0.9 * 0.4) / (0.6 + 0.4)
 * //   { id: "chunk3", score: 0.73 }, // (0.75 * 0.6 + 0.7 * 0.4) / (0.6 + 0.4)
 * // ]
 *
 * @remarks
 * - **Neutral Score**: For chunks missing from a source, the average score of that source
 *   is used as a neutral score to avoid penalizing them. For example, if a chunk is missing
 *   from vector search, it gets the average vector score.
 * - **Normalization**: The function assumes weights sum to 1 (e.g., 0.6 + 0.4 = 1). This
 *   ensures the final score is a weighted average, typically between 0 and 1 if input scores
 *   are in that range.
 * - **Use Case**: Ideal for combining scores from multiple search methods (e.g., full-text
 *   and vector search) where one method might miss relevant chunks, ensuring fairness in
 *   reranking.
 * - **Score Range**: Input scores should be on a consistent scale (e.g., 0-1). If scales
 *   differ, normalize them before passing to this function.
 */
export const reRankingChunk = (
  ...chunksWithWeight: RankingChunksWithWeight[]
): RankingChunk[] => {
  const scoreMap: { [id: string]: { totalScore: number; count: number } } = {};
  const allIds = new Set<string>(); // Track all unique chunk IDs
  const sourceAverages: { [sourceIndex: string]: number } = {}; // Store average score per source

  // Calculate averages for each source and collect all IDs
  chunksWithWeight.forEach(({ chunks }, index) => {
    const scores = chunks.map((chunk) => chunk.score);
    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;
    sourceAverages[index] = averageScore; // Store average for this source

    chunks.forEach(({ id }) => allIds.add(id)); // Collect all unique IDs
  });

  // Aggregate scores with neutral score for missing chunks
  chunksWithWeight.forEach(({ chunks, weight }, index) => {
    const chunkIds = new Set(chunks.map((chunk) => chunk.id)); // IDs in this source

    // Process chunks present in this source
    chunks.forEach(({ id, score }) => {
      if (!scoreMap[id]) {
        scoreMap[id] = { totalScore: 0, count: 0 };
      }
      scoreMap[id].totalScore += score * weight;
      scoreMap[id].count += weight; // Use weight as count to reflect source contribution
    });

    // Apply neutral score to missing chunks from this source
    allIds.forEach((id) => {
      if (!chunkIds.has(id)) {
        if (!scoreMap[id]) {
          scoreMap[id] = { totalScore: 0, count: 0 };
        }
        const neutralScore = sourceAverages[index]; // Use average score as neutral
        scoreMap[id].totalScore += neutralScore * weight;
        scoreMap[id].count += weight;
      }
    });
  });

  // Calculate final scores
  const reranked = Object.entries(scoreMap)
    .map(([id, { totalScore, count }]) => ({
      id,
      score: totalScore / count,
    }))
    .sort((a, b) => b.score - a.score); // Sort by score in DESC

  console.log('reranked:', reranked);
  return reranked;
};
