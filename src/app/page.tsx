
import { getArticles } from '@/lib/data';
import { NewsFeed } from '@/components/news-feed';
import type { CountryCode } from '@/lib/types';

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const country = resolvedSearchParams?.country as CountryCode | undefined;
  const articles = await getArticles(country);
  return <NewsFeed articles={articles} />;
}
