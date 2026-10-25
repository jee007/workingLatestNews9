
'use server';
/**
 * @fileOverview Generates audio from text using a Text-to-Speech model.
 *
 * - generateAudioFromText - A function that handles the TTS process.
 * - GenerateAudioFromTextInput - The input type for the function.
 * - GenerateAudioFromTextOutput - The return type for the function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';
import { incrementApiUsage } from '@/lib/metrics';
import { getApiKeys } from '@/lib/data';

const GenerateAudioFromTextInputSchema = z.string();
export type GenerateAudioFromTextInput = z.infer<typeof GenerateAudioFromTextInputSchema>;

const GenerateAudioFromTextOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a WAV data URI."),
});
export type GenerateAudioFromTextOutput = z.infer<typeof GenerateAudioFromTextOutputSchema>;

export async function generateAudioFromText(input: GenerateAudioFromTextInput): Promise<GenerateAudioFromTextOutput> {
  const { geminiApiKey } = await getApiKeys();
  if (!geminiApiKey?.key || !geminiApiKey?.name) {
    throw new Error('Gemini API key is not configured. Please set one in the admin panel.');
  }
  
  await incrementApiUsage('gemini-generate-audio', geminiApiKey.name);

  const ai = genkit({
    plugins: [googleAI({ apiKey: geminiApiKey.key })],
  });

  const { media } = await ai.generate({
    model: 'googleai/gemini-2.5-flash-preview-tts',
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    },
    prompt: input.substring(0, 5000),
  });

  if (!media) {
    throw new Error('No audio media was returned from the TTS model.');
  }

  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );
  
  const wavBase64 = await toWav(audioBuffer);

  return {
    audioDataUri: `data:audio/wav;base64,${wavBase64}`,
  };
}


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}
