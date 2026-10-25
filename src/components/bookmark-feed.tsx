
'use client';

import type { Article } from '@/lib/types';
import { useBookmark } from '@/hooks/use-bookmark';
import { ArticleCard } from './article/article-card';
import { useMemo, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowUp } from 'lucide-react';

export function BookmarkFeed({ articles }: { articles: Article[] }) {
  const { bookmarks } = useBookmark();
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const bookmarkedArticles = useMemo(() => {
    const bookmarkSet = new Set(bookmarks);
    return articles.filter(article => bookmarkSet.has(article.id));
  }, [articles, bookmarks]);

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {bookmarkedArticles.length === 0 ? (
        <div className="text-center text-muted-foreground mt-10">
          <p className="text-lg">You haven't bookmarked any articles yet.</p>
          <p>Click the bookmark icon on an article to save it for later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bookmarkedArticles.map(article => (
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
