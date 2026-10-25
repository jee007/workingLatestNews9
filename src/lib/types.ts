
export type Language = 'en';

export const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
];

export type Category = 'National' | 'World' | 'Business' | 'Sports' | 'Entertainment' | 'Technology';

export const CATEGORIES: Category[] = [
  'National',
  'World',
  'Business',
  'Sports',
  'Entertainment',
  'Technology',
];

export type CountryCode = 'pk' | 'in' | 'us' | 'sa';

export const COUNTRIES: { code: CountryCode; name:string }[] = [
    { code: 'pk', name: 'Pakistan' },
    { code: 'in', name: 'India' },
    { code: 'us', name: 'United States' },
    { code: 'sa', name: 'Saudi Arabia' },
];

export interface Article {
  id: string; // Unique identifier from the API
  sourceUrl: string; // The original URL to the article source
  title: string;
  body: string;
  source: 'manual' | 'api';
  language: Language;
  category: Category;
  coverImage: string;
  author: string;
  publishDate: string; // ISO string
  tags: string[];
  isFeatured?: boolean;
  "data-ai-hint"?: string;
  country?: CountryCode;
  fullBody?: string;
}
