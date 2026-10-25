
'use client';

import { useFilter } from '@/hooks/use-filter';
import { CATEGORIES, type Category } from '@/lib/types';
import { Bookmark, LayoutGrid, Globe, Building, Clapperboard, Cpu, Medal } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const categoryIcons: Record<string, React.ElementType> = {
  All: LayoutGrid,
  National: LayoutGrid,
  World: Globe,
  Business: Building,
  Sports: Medal,
  Entertainment: Clapperboard,
  Technology: Cpu,
};

export function SidebarNav() {
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
  
  const bookmarkHref = {
    pathname: '/bookmarks',
    query: Object.fromEntries(searchParams),
  };

  return (
    <nav className="flex flex-col gap-4 px-2">
      <div>
        <h2 className="px-2 mb-2 text-lg font-semibold tracking-tight font-headline">Categories</h2>
        <div className="space-y-1">
          <Button
            variant={category === 'All' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleCategoryClick('All')}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            All
          </Button>
          {CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat];
            return (
                <Button
                    key={cat}
                    variant={category === cat ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => handleCategoryClick(cat)}
                >
                    <Icon className="mr-2 h-4 w-4" />
                    {cat}
                </Button>
            )
          })}
        </div>
      </div>
      <div>
        <h2 className="px-2 mt-4 mb-2 text-lg font-semibold tracking-tight font-headline">Library</h2>
        <div className="space-y-1">
          <Button
            variant={pathname === '/bookmarks' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link href={bookmarkHref}>
              <Bookmark className="mr-2 h-4 w-4" />
              Bookmarks
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
