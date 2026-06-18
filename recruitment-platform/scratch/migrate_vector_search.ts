import 'dotenv/config';
import { prisma } from '../lib/prisma';


async function main() {
  console.log('Starting DB migration for smart search autocomplete...');

  try {
    // 1. Add columns to jobs table
    console.log('Adding views_count, applies_count, and search_embedding columns if they do not exist...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS applies_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS search_embedding vector(384);
    `);
    console.log('Columns added successfully.');

    // 2. Create HNSW index
    console.log('Creating HNSW index on search_embedding column...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS jobs_search_embedding_hnsw_idx 
      ON jobs USING hnsw (search_embedding vector_cosine_ops);
    `);
    console.log('HNSW index created successfully.');

    // 3. Create match_jobs helper function
    console.log('Creating match_jobs function...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION match_jobs(
        query_embedding vector(384),
        match_threshold float,
        match_count int
      )
      RETURNS TABLE (
        id varchar(191),
        title varchar(191),
        score float
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          j.id,
          j.title,
          (0.7 * (1 - (j.search_embedding <=> query_embedding)) + 
           0.3 * (1 - exp(-j.applies_count::float / 10.0))) AS score
        FROM jobs j
        WHERE 
          j.status = 'ACTIVE' 
          AND j.search_embedding IS NOT NULL
          AND (1 - (j.search_embedding <=> query_embedding)) > match_threshold
        ORDER BY score DESC
        LIMIT match_count;
      END;
      $$;
    `);
    console.log('match_jobs function created/updated successfully.');

    console.log('DB migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
