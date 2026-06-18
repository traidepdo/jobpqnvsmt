// Optimized search: Embedding model loading has been disabled to prevent RAM overhead.
// The search suggestion API now uses Postgres native unaccent text search.

export async function getEmbedding(text: string): Promise<number[]> {
  console.log('getEmbedding called (disabled to save RAM):', text);
  return [];
}
