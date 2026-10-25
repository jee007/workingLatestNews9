
'use client';

import type { Article } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ArticleCard({ article }: { article: Article }) {
  const displayContent = { title: article.title, body: article.body };
  
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(
      new Date(article.publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
  }, [article.publishDate]);

  const articleUrl = `/articles/${encodeURIComponent(article.id)}${article.country ? `?country=${article.country}` : ''}`;

  return (
    <Link href={articleUrl} className="group">
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={article.coverImage}
              alt={displayContent.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={article['data-ai-hint']}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 flex flex-col">
          <Badge variant="secondary" className="w-fit mb-2">{article.category}</Badge>
          <CardTitle className="font-headline text-lg mb-2 leading-tight">
            {displayContent.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-3 flex-1">
            {displayContent.body}
          </p>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Button variant="link" className="p-0 h-auto text-primary">
                Read More <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
