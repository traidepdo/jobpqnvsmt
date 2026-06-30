export interface Blogs {
    id: string;
    slug: string;
    title: string;
    description: string;
    content: string;
    thumbnail: string;
    author: Author;
    category: Category;
    views: number;
    createdAt: string;
    updatedAt: string;
}

interface Author {
    id: string;
    name: string;
}

interface Category {
    id: string;
    slug: string;
    name: string;
}

export interface CategoryBlogs {
    id: string;
    slug: string;
    name: string;
}