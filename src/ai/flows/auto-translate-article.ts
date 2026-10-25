
'use server';

/**
 * @fileOverview Automatically translates article content into the user's preferred language if the original source is unavailable in that language.
 *
 * - autoTranslateArticle - A function that handles the article translation process.
 * - AutoTranslateArticleInput - The input type for the autoTranslateArticle function.
 * - AutoTranslateArticleOutput - The return type for the autoTranslateArticle function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { incrementApiUsage } from '@/lib/metrics';
import { getApiKeys } from '@/lib/data';

const AutoTranslateArticleInputSchema = z.object({
  text: z.string().describe('The text content of the article to be translated.'),
  targetLanguage: z.string().describe('The target language code (e.g., en, hi, ta).'),
});
export type AutoTranslateArticleInput = z.infer<typeof AutoTranslateArticleInputSchema>;

const AutoTranslateArticleOutputSchema = z.object({
  translatedText: z.string().describe('The translated text content of the article.'),
});
export type AutoTranslateArticleOutput = z.infer<typeof AutoTranslateArticleOutputSchema>;

export async function autoTranslateArticle(input: AutoTranslateArticleInput): Promise<AutoTranslateArticleOutput> {
  const { geminiApiKey } = await getApiKeys();
  if (!geminiApiKey?.key || !geminiApiKey?.name) {
    throw new Error('Gemini API key is not configured. Please set one in the admin panel.');
  }

  await incrementApiUsage('gemini-auto-translate-article', geminiApiKey.name);

  const ai = genkit({
    plugins: [googleAI({ apiKey: geminiApiKey.key })],
    model: 'googleai/gemini-2.0-flash',
  });

  const prompt = ai.definePrompt({
    name: 'autoTranslateArticlePrompt_dynamic',
    input: {schema: AutoTranslateArticleInputSchema},
    output: {schema: AutoTranslateArticleOutputSchema},
    prompt: `Translate the following text into {{targetLanguage}}:\n\n{{text}}`,
  });
  
  const {output} = await prompt(input);
  if (!output) {
      throw new Error("The AI model did not return a valid translation.");
  }
  return output;
}
