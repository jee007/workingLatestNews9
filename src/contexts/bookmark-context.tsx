
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BookmarkContextType {
  bookmarks: string[];
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

export const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

const BOOKMARKS_STORAGE_KEY = 'lingonews-bookmarks';

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      }
    } catch (error) {
      console.error('Failed to load bookmarks from localStorage', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Failed to save bookmarks to localStorage', error);
    }
  }, [bookmarks]);

  const addBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    toast({
        title: 'Article Bookmarked',
        description: 'You can find it in your library.',
    });
  }, [toast]);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((bookmarkId) => bookmarkId !== id));
    toast({
        title: 'Bookmark Removed',
        description: 'The article has been removed from your library.',
    });
  }, [toast]);

  const isBookmarked = useCallback((id: string) => {
    return bookmarks.includes(id);
  }, [bookmarks]);

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}
