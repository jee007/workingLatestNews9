'use client';

import type { Category } from '@/lib/types';
import React, { createContext, useState, ReactNode } from 'react';

interface FilterContextType {
  category: Category | 'All';
  setCategory: (category: Category | 'All') => void;
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<Category | 'All'>('All');

  return (
    <FilterContext.Provider value={{ category, setCategory }}>
      {children}
    </FilterContext.Provider>
  );
}
