export default function useDetailsJob({ query, location, category, companySlug, salary, type, experience, level, sort, featured }: { query?: string, location?: string, category?: string, companySlug?: string, salary?: string, type?: string, experience?: string, level?: string, sort?: string, featured?: string }) {
    const getClearFilterLink = () => {
        const q = [];
        if (query) q.push(`query=${encodeURIComponent(query)}`);
        if (location) q.push(`location=${encodeURIComponent(location)}`);
        return `/jobs${q.length ? '?' + q.join('&') : ''}`;
    };
    const getSortFilterLink = (sortVal: string) => {
        const q = [`sort=${sortVal}`];
        if (query) q.push(`query=${encodeURIComponent(query)}`);
        if (location) q.push(`location=${encodeURIComponent(location)}`);
        if (category) q.push(`category=${encodeURIComponent(category)}`);
        if (companySlug) q.push(`company=${encodeURIComponent(companySlug)}`);
        if (salary) q.push(`salary=${encodeURIComponent(salary)}`);
        if (type) q.push(`type=${encodeURIComponent(type)}`);
        if (experience) q.push(`experience=${encodeURIComponent(experience)}`);
        if (level) q.push(`level=${encodeURIComponent(level)}`);
        if (featured) q.push(`featured=${encodeURIComponent(featured)}`);
        return `/jobs?${q.join('&')}`;
    };

    const getPageLink = (pageVal: number) => {
        const q = [`page=${pageVal}`];
        if (query) q.push(`query=${encodeURIComponent(query)}`);
        if (location) q.push(`location=${encodeURIComponent(location)}`);
        if (category) q.push(`category=${encodeURIComponent(category)}`);
        if (companySlug) q.push(`company=${encodeURIComponent(companySlug)}`);
        if (salary) q.push(`salary=${encodeURIComponent(salary)}`);
        if (type) q.push(`type=${encodeURIComponent(type)}`);
        if (experience) q.push(`experience=${encodeURIComponent(experience)}`);
        if (level) q.push(`level=${encodeURIComponent(level)}`);
        if (sort) q.push(`sort=${encodeURIComponent(sort)}`);
        if (featured) q.push(`featured=${encodeURIComponent(featured)}`);
        return `/jobs?${q.join('&')}`;
    };

    const getFilterRemoveLink = (filterType: 'category' | 'salary' | 'experience' | 'type' | 'level' | 'company') => {
        const q = [`sort=${sort}`];
        if (query) q.push(`query=${encodeURIComponent(query)}`);
        if (location) q.push(`location=${encodeURIComponent(location)}`);
        if (category && filterType !== 'category') q.push(`category=${encodeURIComponent(category)}`);
        if (companySlug && filterType !== 'company') q.push(`company=${encodeURIComponent(companySlug)}`);
        if (salary && filterType !== 'salary') q.push(`salary=${encodeURIComponent(salary)}`);
        if (type && filterType !== 'type') q.push(`type=${encodeURIComponent(type)}`);
        if (experience && filterType !== 'experience') q.push(`experience=${encodeURIComponent(experience)}`);
        if (level && filterType !== 'level') q.push(`level=${encodeURIComponent(level)}`);
        if (featured) q.push(`featured=${encodeURIComponent(featured)}`);
        return `/jobs?${q.join('&')}`;
    };
    return { getClearFilterLink, getSortFilterLink, getPageLink, getFilterRemoveLink };
}