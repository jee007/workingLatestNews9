
'use client';

import type { Article } from '@/lib/types';
import { useBookmark } from '@/hooks/use-bookmark';
import { generateFullArticle } from '@/ai/flows/generate-full-article';
import { generateAudioFromText } from '@/ai/flows/generate-audio-from-text';
import { saveFullArticle } from '@/lib/data';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowUp, Bookmark, ExternalLink, Loader2, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function getReadingTime(text: string) {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

export function ArticleView({ article }: { article: Article }) {
  const router = useRouter();
  const { toast } = useToast();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmark();

  const [isExpanded, setIsExpanded] = useState(!!article.fullBody);
  const [formattedDate, setFormattedDate] = useState('');
  
  const [fullArticle, setFullArticle] = useState<string | null>(article.fullBody || null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const isCurrentlyBookmarked = isBookmarked(article.id);

  const handleBookmarkToggle = useCallback(() => {
    if (isCurrentlyBookmarked) {
      removeBookmark(article.id);
    } else {
      addBookmark(article.id);
    }
  }, [isCurrentlyBookmarked, addBookmark, removeBookmark, article.id]);

  useEffect(() => {
    setFormattedDate(new Date(article.publishDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }));
  }, [article.publishDate]);
  
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

  const displayContent = { title: article.title, body: article.body };
  
  const readingTime = useMemo(() => getReadingTime(isExpanded && fullArticle ? fullArticle : displayContent.body), [displayContent.body, isExpanded, fullArticle]);

  const handleContinueReading = async () => {
    if (isGenerating) return;

    if (fullArticle) {
      setIsExpanded(true);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateFullArticle({
        title: displayContent.title,
        description: displayContent.body,
      });
      setFullArticle(result.fullArticleText);
      setIsExpanded(true);
      await saveFullArticle(article.id, result.fullArticleText);
    } catch (error) {
      console.error('Failed to generate full article:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Article',
        description: 'Could not generate the full article. Please try again later.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (isGeneratingAudio || audioUrl) return;
    setIsGeneratingAudio(true);
    try {
      const contentToSpeak = displayContent.body;
      const result = await generateAudioFromText(contentToSpeak);
      setAudioUrl(result.audioDataUri);
    } catch (error) {
      console.error('Failed to generate audio:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Audio',
        description: 'Could not generate an audio version of the article. Please try again later.',
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const showContinueReadingButton = useMemo(() => {
    return displayContent.body && displayContent.body !== 'No content available.';
  }, [displayContent.body]);

  const bodyToDisplay = isExpanded && fullArticle ? fullArticle : displayContent.body;

  const contentSkeletons = (
    <div className="space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-full mt-4" />
      <Skeleton className="h-6 w-5/6" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-card p-4 sm:p-6 md:p-8 rounded-lg shadow-lg">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <article>
        <header className="mb-8">
            <Badge variant="secondary" className="mb-4">{article.category}</Badge>
            <h1 className="font-headline text-3xl md:text-5xl font-bold mb-4 leading-tight">{displayContent.title}</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-x-2 flex-wrap">
                    <span>By <strong>{article.author}</strong></span>
                    <span className="hidden sm:inline">|</span>
                    <time dateTime={article.publishDate}>{formattedDate}</time>
                </div>
                <span>{readingTime} min read</span>
            </div>
        </header>
        
        <div className="relative h-64 md:h-96 w-full mb-8 rounded-lg overflow-hidden">
            <Image src={article.coverImage} alt={displayContent.title} fill className="object-cover" data-ai-hint={article['data-ai-hint']} />
        </div>

        <div className="prose prose-lg max-w-none text-foreground prose-headings:font-headline prose-headings:text-foreground">
            <div className="whitespace-pre-line text-lg leading-relaxed">
              {isGenerating ? contentSkeletons : bodyToDisplay}
            </div>

            {!isExpanded && showContinueReadingButton && (
              <Button onClick={handleContinueReading} disabled={isGenerating} className="mt-4">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Continue Reading'
                )}
              </Button>
            )}
        </div>
        
        {audioUrl && (
            <div className="mt-8">
                <h3 className="text-xl font-headline mb-2">Listen to the Article</h3>
                <audio controls src={audioUrl} className="w-full rounded-lg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        )}

        <footer className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                {article.tags.length > 0 && article.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Listen to article" onClick={handleGenerateAudio} disabled={isGeneratingAudio || !!audioUrl}>
                    {isGeneratingAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                 <Button asChild variant="outline">
                    <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                        View Original <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
                <Button variant="outline" size="icon" aria-label="Bookmark article" onClick={handleBookmarkToggle}>
                    <Bookmark className={`h-5 w-5 transition-colors ${isCurrentlyBookmarked ? 'fill-primary text-primary' : ''}`} />
                </Button>
            </div>
        </footer>

        <div className="mt-8 pt-6 border-t flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to News
            </Button>
            <Button variant="outline" onClick={scrollToTop}>
                Back to Top
                <ArrowUp className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </article>

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
