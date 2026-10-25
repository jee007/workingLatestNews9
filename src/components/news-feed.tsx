'use client';

import type { Article } from '@/lib/types';
import { useFilter } from '@/hooks/use-filter';
import { ArticleCard } from './article/article-card';
import { useMemo, useState, useEffect, useTransition } from 'react';
import { AdBanner } from './ad-banner';
import { Button } from './ui/button';
import { ArrowUp, RefreshCw, Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { refreshPath } from '@/app/actions';

export function NewsFeed({ articles }: { articles: Article[] }) {
  const { category } = useFilter();
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesCategory = category === 'All' || article.category === category;
      return matchesCategory;
    });
  }, [articles, category]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRefresh = () => {
    startTransition(() => {
      refreshPath(pathname);
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <AdBanner />
      {filteredArticles.length === 0 ? (
        <div className="text-center text-muted-foreground mt-10 space-y-4">
          <p className="text-lg">No articles match your current filters.</p>
          <p>Try clearing your search or refresh to check for new content.</p>
          <Button onClick={handleRefresh} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
