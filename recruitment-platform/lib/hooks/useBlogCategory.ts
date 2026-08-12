
export const handleSearch = (e: React.FormEvent, slug: string, searchInput: string, router: any) => {
    e.preventDefault();
    router.push(`/blog-category/${slug}?page=1&search=${encodeURIComponent(searchInput)}`);
};

export const handlePage = (p: number, slug: string, currentSearch: string, router: any) => {
    router.push(`/blog-category/${slug}?page=${p}&search=${encodeURIComponent(currentSearch)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};