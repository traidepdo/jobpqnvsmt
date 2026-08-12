import { prisma } from "@/lib/prisma";
import { CategoryBlogs } from '@/lib/types/blogs/main';
import { Category } from '@/lib/types/category';

export const categoryService = {
    async getAllCategories(): Promise<Category[]> {
        try {
            const categories = await prisma.category.findMany();
            const categoryList: Category[] = categories.map((category) => ({
                id: category.id,
                slug: category.slug,
                name: category.name,
            }));
            return categoryList;
        } catch (error) {
            console.error(error);
            return [];
        }
    }
}
export const getblogcategory = async (): Promise<CategoryBlogs[]> => {
    try {
        const categories = await prisma.blogCategory.findMany();
        const categoryList: CategoryBlogs[] = categories.map((category) => ({
            id: category.id,
            slug: category.slug,
            name: category.name,
        }));
        return categoryList;
    } catch (error) {
        console.error(error);
        return [];
    }
}