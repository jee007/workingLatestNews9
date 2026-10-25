
import type { Article, Category, CountryCode } from './types';
import { CATEGORIES } from './types';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { incrementApiUsage } from './metrics';

interface ApiKey {
  name: string;
  key: string;
}

/**
 * Sanitizes an ID string to be safely used as a Firestore document ID.
 * It Base64-encodes the string, which removes any invalid characters like '/'.
 * @param id The original article ID.
 * @returns A Firestore-safe document ID.
 */
const sanitizeIdForFirestore = (id: string) => Buffer.from(id).toString('base64');


/**
 * Retrieves API keys from Firestore or falls back to environment variables.
 * This function also implements key rotation logic for Newsdata.io if configured.
 * This function is now read-only to be safe to call from any context.
 * @returns {Promise<{ newsdataApiKey?: ApiKey; geminiApiKey?: ApiKey; newsdataShouldRotate?: boolean }>} The active API keys and rotation config.
 */
export async function getApiKeys(): Promise<{ newsdataApiKey?: ApiKey; geminiApiKey?: ApiKey; newsdataShouldRotate?: boolean }> {
  try {
    if (!db) {
      // Fallback to environment variables if Firebase is not configured
      return {
        newsdataApiKey: process.env.NEWSDATA_API_KEY ? { name: 'Default Env Key', key: process.env.NEWSDATA_API_KEY } : undefined,
        geminiApiKey: process.env.GEMINI_API_KEY ? { name: 'Default Env Key', key: process.env.GEMINI_API_KEY } : undefined,
        newsdataShouldRotate: false,
      };
    }
    
    const apiKeysDocRef = doc(db, 'settings', 'apiKeys');
    const apiKeysSnap = await getDoc(apiKeysDocRef);
    const apiKeysData = apiKeysSnap.exists() ? apiKeysSnap.data() : {};

    let newsdataApiKey: ApiKey | undefined;
    const newsdataConfig = apiKeysData.newsdata;
    const newsdataShouldRotate = newsdataConfig?.rotate === true;
    
    const validNewsdataKeys = (newsdataConfig?.keys || []).filter((k: ApiKey) => k && k.name && k.key);

    if (validNewsdataKeys.length > 0) {
      if (newsdataShouldRotate) {
        const apiStateDocRef = doc(db, 'settings', 'apiState');
        const apiStateSnap = await getDoc(apiStateDocRef);
        const lastUsedName = apiStateSnap.exists() ? apiStateSnap.data().lastUsedNewsdataKeyName : undefined;
        
        const lastUsedIndex = validNewsdataKeys.findIndex((k: ApiKey) => k.name === lastUsedName);
        const nextIndex = (lastUsedIndex + 1) % validNewsdataKeys.length;
        newsdataApiKey = validNewsdataKeys[nextIndex];

      } else {
        newsdataApiKey = validNewsdataKeys.find((k: ApiKey) => k.name === newsdataConfig.activeKeyName);
      }
      if (!newsdataApiKey) {
        newsdataApiKey = validNewsdataKeys[0];
      }
    } else if (process.env.NEWSDATA_API_KEY) {
      newsdataApiKey = { name: 'Default Env Key', key: process.env.NEWSDATA_API_KEY };
    }
    
    let geminiApiKey: ApiKey | undefined;
    const geminiConfig = apiKeysData.gemini;
    const validGeminiKeys = (geminiConfig?.keys || []).filter((k: ApiKey) => k && k.name && k.key);

    if (validGeminiKeys.length > 0) {
      geminiApiKey = validGeminiKeys.find((k: ApiKey) => k.name === geminiConfig.activeKeyName);
      if (!geminiApiKey) {
        geminiApiKey = validGeminiKeys[0];
      }
    } else if (process.env.GEMINI_API_KEY) {
      geminiApiKey = { name: 'Default Env Key', key: process.env.GEMINI_API_KEY };
    }
    
    return { newsdataApiKey, geminiApiKey, newsdataShouldRotate };
  } catch (error: any) {
    console.error(`A critical error occurred while fetching API keys. Falling back. Error: ${error.message}`);
    // Fallback to environment variables on any error
    return {
      newsdataApiKey: process.env.NEWSDATA_API_KEY ? { name: 'Fallback Env Key', key: process.env.NEWSDATA_API_KEY } : undefined,
      geminiApiKey: process.env.GEMINI_API_KEY ? { name: 'Fallback Env Key', key: process.env.GEMINI_API_KEY } : undefined,
      newsdataShouldRotate: false,
    };
  }
}

function mapNewsdataArticle(apiArticle: any, country: CountryCode): Article | null {
  if (!apiArticle.title || !apiArticle.link || !apiArticle.article_id) {
    return null;
  }
  
  const bodyText = (apiArticle.description || apiArticle.content || '').trim();
  if (!bodyText || bodyText.toLowerCase() === '[removed]' || bodyText.toLowerCase() === 'no content available.' || bodyText.toLowerCase().includes('only available in paid plans')) {
    return null;
  }

  const apiCategoryName = apiArticle.category?.[0]?.toLowerCase();
  
  let finalCategory: Category;

  // Map API categories to our app's categories
  switch (apiCategoryName) {
    case 'technology':
      finalCategory = 'Technology';
      break;
    case 'sports':
      finalCategory = 'Sports';
      break;
    case 'business':
      finalCategory = 'Business';
      break;
    case 'world':
      finalCategory = 'World';
      break;
    case 'entertainment':
      finalCategory = 'Entertainment';
      break;
    case 'top':
      finalCategory = 'National';
      break;
    default:
      // If the category is not one we explicitly handle, we don't include the article.
      // This prevents unknown categories from appearing.
      if (CATEGORIES.map(c => c.toLowerCase()).includes(apiCategoryName)) {
        finalCategory = CATEGORIES.find(c => c.toLowerCase() === apiCategoryName)!;
      } else {
        return null;
      }
  }


  return {
    id: apiArticle.article_id,
    sourceUrl: apiArticle.link,
    title: apiArticle.title,
    body: bodyText,
    source: 'api',
    language: 'en',
    category: finalCategory,
    coverImage: apiArticle.image_url || `https://placehold.co/600x400.png`,
    author: apiArticle.creator?.[0] || apiArticle.source_id || 'Unknown Source',
    publishDate: new Date(apiArticle.pubDate).toISOString(),
    tags: apiArticle.keywords || [],
    'data-ai-hint': finalCategory.toLowerCase(),
    country: country,
  };
}

async function fetchArticlesFromNewsdata(apiKey: ApiKey, country: CountryCode, categories: Category[]): Promise<Article[]> {
  try {
    if (!apiKey?.key || categories.length === 0) {
      return [];
    }

    let categoryParam: string;
    if (categories.length === 1 && categories[0] === 'National') {
      // 'top' is the API equivalent for general/national news
      categoryParam = 'top';
    } else {
      // The API maps our 'World' to 'world', 'Technology' to 'technology' etc.
      categoryParam = categories.map(c => c.toLowerCase()).join(',');
    }

    const url = `https://newsdata.io/api/1/news?apikey=${apiKey.key}&country=${country}&language=en&image=1&category=${categoryParam}&size=10`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!response.ok) {
      console.warn(`Failed to fetch news from Newsdata.io for key '${apiKey.name}' and categories [${categories.join(', ')}]: ${response.statusText}`);
      return [];
    }
    
    await incrementApiUsage('newsdata', apiKey.name);
    const data = await response.json();
    
    if (data.status !== 'success' || !data.results || data.results.length === 0) {
      return [];
    }
    
    const uniqueApiArticles = (data.results || []).filter((article: any) => article.duplicate === false);
    
    return uniqueApiArticles
      .map((article: any) => mapNewsdataArticle(article, country))
      .filter((article: Article | null): article is Article => article !== null);
  } catch (error: any) {
    console.error(`A critical error occurred in fetchArticlesFromNewsdata. Error: ${error.message}`);
    return [];
  }
}

async function fetchAndCacheArticles(country: CountryCode): Promise<Article[]> {
  const { newsdataApiKey, newsdataShouldRotate } = await getApiKeys();
  if (!newsdataApiKey) {
    console.warn(`No valid Newsdata.io API key available to fetch articles for country '${country}'.`);
    return [];
  }

  // Fetch articles for each category individually to ensure a good mix.
  const categoryPromises = CATEGORIES.map(category => 
    fetchArticlesFromNewsdata(newsdataApiKey, country, [category])
  );
  
  const resultsByCategory = await Promise.all(categoryPromises);
  const allArticles = resultsByCategory.flat();

  if (allArticles.length === 0) {
      console.warn(`API calls for country '${country}' finished but returned no articles. Your API key '${newsdataApiKey.name}' might be invalid or have restrictions.`);
      return [];
  }
  
  const seenTitles = new Set<string>();
  const uniqueArticles: Article[] = [];

  for (const article of allArticles) {
    const normalizedTitle = article.title.trim().toLowerCase();
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniqueArticles.push(article);
    }
  }

  uniqueArticles.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  if (db) {
      try {
        const cacheDocRef = doc(db, 'newsCache', country);
        await setDoc(cacheDocRef, {
            articles: uniqueArticles,
            lastFetched: serverTimestamp()
        });
        console.log(`Updated Firestore cache for '${country}'. Fetched from ${CATEGORIES.length} categories.`);
        
        if (newsdataShouldRotate && newsdataApiKey.name) {
          try {
            const apiStateDocRef = doc(db, 'settings', 'apiState');
            await setDoc(apiStateDocRef, { lastUsedNewsdataKeyName: newsdataApiKey.name }, { merge: true });
            console.log(`Updated API key rotation state. Current key: ${newsdataApiKey.name}`);
          } catch(e) {
             console.error(`Non-critical error: Failed to update API key rotation state. The app will continue to function. Error: ${e}`);
          }
        }
      } catch (error: any) {
        console.error(`CRITICAL: Failed to write to Firestore cache for country '${country}'. This might be a permissions issue. Error: ${error.message}`);
      }
  }

  return uniqueArticles;
}

export async function getArticles(country: CountryCode = 'us'): Promise<Article[]> {
    try {
      if (db) {
          const cacheDocRef = doc(db, 'newsCache', country);
          const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
          
          const docSnap = await getDoc(cacheDocRef);
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.lastFetched && typeof data.lastFetched.toDate === 'function') {
                  const lastFetched = data.lastFetched.toDate();
                  if (Date.now() - lastFetched.getTime() < CACHE_DURATION_MS) {
                      console.log(`Serving articles for '${country}' from Firestore cache.`);
                      return (data.articles || []) as Article[];
                  }
              }
          }
      }

      console.log(`Fetching new articles for country '${country}'...`);
      return await fetchAndCacheArticles(country);
    } catch (error: any) {
      console.error(`A critical error occurred in getArticles for country '${country}'. Returning empty array. Error: ${error.message}`);
      return [];
    }
}

export async function getCachedFullArticle(articleId: string): Promise<string | null> {
  try {
    if (!db) return null;
    
    const sanitizedId = sanitizeIdForFirestore(articleId);
    const docRef = doc(db, 'generatedArticles', sanitizedId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`Serving full article for '${articleId}' from Firestore cache.`);
      return docSnap.data().fullArticleText || null;
    }
  } catch (error: any) {
    console.error(`Error fetching cached full article. The app will proceed without it. Error: ${error.message}`);
  }
  
  return null;
}

export async function saveFullArticle(articleId: string, fullArticleText: string): Promise<void> {
  try {
    if (!db) return;
    
    const sanitizedId = sanitizeIdForFirestore(articleId);
    const docRef = doc(db, 'generatedArticles', sanitizedId);

    // Get the current time as a Firestore Timestamp
    const now = Timestamp.now();
    
    // Calculate the expiration timestamp by adding 7 days worth of seconds
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    const expireAt = new Timestamp(now.seconds + sevenDaysInSeconds, now.nanoseconds);

    await setDoc(docRef, {
      fullArticleText,
      createdAt: now,
      expireAt: expireAt,
    });

    console.log(`Cached full article for '${articleId}' in Firestore, will expire on ${expireAt.toDate().toISOString()}`);
  } catch (error: any) {
    console.error(`Error saving full article to cache. Error: ${error.message}`);
  }
}

export async function getArticle(id: string, country?: CountryCode): Promise<Article | undefined> {
  try {
    const articles = await getArticles(country);
    const article = articles.find(a => a.id === id);

    if (article) {
      const cachedFullBody = await getCachedFullArticle(article.id);
      if (cachedFullBody) {
        article.fullBody = cachedFullBody;
      }
    }

    return article;
  } catch (error: any) {
    console.error(`A critical error occurred in getArticle for id '${id}'. Returning undefined. Error: ${error.message}`);
    return undefined;
  }
}
