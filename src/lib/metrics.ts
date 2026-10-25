
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

export const KNOWN_APIS = [
    { id: 'newsdata', name: 'Newsdata.io API' },
    { id: 'gemini-generate-full-article', name: 'Gemini (Generate Article)' },
    { id: 'gemini-auto-translate-article', name: 'Gemini (Translate Article)' },
    { id: 'gemini-generate-audio', name: 'Gemini (Generate Audio)' },
];

export async function incrementApiUsage(apiName: string, keyName: string) {
  if (!db || !keyName) {
    return;
  }
  
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = today.getUTCDate().toString().padStart(2, '0');
  
  const monthKey = `${year}-${month}`;
  const dayKey = `${year}-${month}-${day}`;

  const usageDocRef = doc(db, 'apiUsage', apiName, 'keys', keyName);

  // This function will now throw an error if it fails, which will be caught
  // by the master error handler in `getArticles`.
  await setDoc(usageDocRef, {
      daily: {
          [dayKey]: increment(1)
      },
      monthly: {
          [monthKey]: increment(1)
      },
      lastUpdated: serverTimestamp()
  }, { merge: true });
}
