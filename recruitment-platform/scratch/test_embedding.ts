import { pipeline } from '@xenova/transformers';

async function test() {
  console.log('Loading pipeline...');
  const extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
  console.log('Pipeline loaded successfully.');
  
  const text = 'Chức danh: Kế toán trưởng. Mô tả: Quản lý phòng kế toán.';
  console.log('Generating embedding for:', text);
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  const vector = Array.from(output.data);
  
  console.log('Embedding dimension:', vector.length);
  console.log('First 5 values:', vector.slice(0, 5));
}

test().catch(console.error);
