
'use client';

import { useContext } from 'react';
import { BookmarkContext } from '@/contexts/bookmark-context';

export function useBookmark() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmark must be used within a BookmarkProvider');
  }
  return context;
}
