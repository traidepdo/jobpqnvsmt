import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('hotel') || lower.includes('khách sạn') || lower.includes('resort')) return 'hotel';
  if (lower.includes('restaurant') || lower.includes('nhà hàng') || lower.includes('ăn') || lower.includes('f&b')) return 'restaurant';
  if (lower.includes('tour') || lower.includes('hướng dẫn') || lower.includes('du lịch')) return 'explore';
  if (lower.includes('security') || lower.includes('bảo vệ')) return 'shield';
  if (lower.includes('spa') || lower.includes('beauty')) return 'spa';
  if (lower.includes('it') || lower.includes('tech') || lower.includes('công nghệ')) return 'computer';
  if (lower.includes('retail') || lower.includes('bán lẻ') || lower.includes('bán hàng') || lower.includes('kinh doanh')) return 'shopping_bag';
  if (lower.includes('bảo hiểm')) return 'shield_with_heart';
  if (lower.includes('bất động sản')) return 'real_estate_agent';
  if (lower.includes('dệt may') || lower.includes('thời trang')) return 'apparel';
  if (lower.includes('dược') || lower.includes('hóa chất') || lower.includes('y tế')) return 'biotech';
  if (lower.includes('giáo dục') || lower.includes('đào tạo')) return 'school';
  if (lower.includes('kế toán') || lower.includes('tài chính')) return 'payments';
  return 'work';
}

async function main() {
  const { prisma } = await import('../lib/prisma.js');
  
  // Lấy tất cả danh mục
  const categories = await prisma.category.findMany();
  console.log(`Tìm thấy ${categories.length} danh mục trong database.`);

  for (const cat of categories) {
    const icon = getCategoryIcon(cat.name);
    console.log(`Cập nhật danh mục: "${cat.name}" -> icon: "${icon}"`);
    await prisma.category.update({
      where: { id: cat.id },
      data: { icon }
    });
  }

  console.log("Đã cập nhật toàn bộ icon danh mục thành công!");
}

main().catch(console.error);
