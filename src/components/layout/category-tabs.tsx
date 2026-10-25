
'use client';

import { useFilter } from '@/hooks/use-filter';
import { CATEGORIES, type Category } from '@/lib/types';
import { Button } from '../ui/button';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function CategoryTabs() {
  const { category, setCategory } = useFilter();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleCategoryClick = (newCategory: Category | 'All') => {
    setCategory(newCategory);
    // If we are on any page that is not the main news feed (e.g., admin, an article, or bookmarks),
    // a category click should navigate us back to the main feed to see the results.
    if (pathname !== '/') {
      const search = searchParams.toString();
      const query = search ? `?${search}` : '';
      router.push(`/${query}`);
    }
  };

  const allCategories: (Category | 'All')[] = ['All', ...CATEGORIES];

  return (
    <div className="md:hidden border-b bg-card/80 backdrop-blur-sm sticky top-16 z-10">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2 px-4 py-2">
          {allCategories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              className="rounded-full h-auto px-4 py-1"
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
