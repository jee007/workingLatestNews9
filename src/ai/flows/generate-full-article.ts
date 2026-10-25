
'use server';
/**
 * @fileOverview Generates a full article from a title and description.
 *
 * - generateFullArticle - A function that handles generating the full article.
 * - GenerateFullArticleInput - The input type for the generateFullArticle function.
 * - GenerateFullArticleOutput - The return type for the generateFullArticle function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { incrementApiUsage } from '@/lib/metrics';
import { getApiKeys } from '@/lib/data';

const GenerateFullArticleInputSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  description: z.string().describe('The short description or summary of the news article.'),
});
export type GenerateFullArticleInput = z.infer<typeof GenerateFullArticleInputSchema>;

const GenerateFullArticleOutputSchema = z.object({
  fullArticleText: z.string().describe('The full, generated text of the news article.'),
});
export type GenerateFullArticleOutput = z.infer<typeof GenerateFullArticleOutputSchema>;

export async function generateFullArticle(input: GenerateFullArticleInput): Promise<GenerateFullArticleOutput> {
  const { geminiApiKey } = await getApiKeys();
  if (!geminiApiKey?.key || !geminiApiKey?.name) {
    throw new Error('Gemini API key is not configured. Please set one in the admin panel.');
  }

  await incrementApiUsage('gemini-generate-full-article', geminiApiKey.name);
  
  const ai = genkit({
    plugins: [googleAI({ apiKey: geminiApiKey.key })],
    model: 'googleai/gemini-2.0-flash',
  });

  const prompt = ai.definePrompt({
    name: 'generateFullArticlePrompt_dynamic',
    input: {schema: GenerateFullArticleInputSchema},
    output: {schema: GenerateFullArticleOutputSchema},
    prompt: `You are a professional news journalist. Your task is to write a full, comprehensive news article based on the provided title and summary. The article should be well-structured, informative, and written in a neutral, journalistic tone.

Article Title: {{{title}}}

Article Summary: {{{description}}}

Please generate the full article text.`,
  });

  const {output} = await prompt(input);
  if (!output) {
      throw new Error("The AI model did not return a valid article.");
  }
  return output;
}
