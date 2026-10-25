
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export type ContactFormState = {
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
  isSuccess: boolean;
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const validatedFields = contactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Please correct the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
      isSuccess: false,
    };
  }
  
  if (!db) {
    console.error('Contact form submission failed: Firebase is not configured.');
    return {
      message: 'The server is not configured to receive messages. Please contact support.',
      isSuccess: false,
    };
  }

  const { name, email, message } = validatedFields.data;

  try {
    await addDoc(collection(db, 'contactSubmissions'), {
        name,
        email,
        message,
        createdAt: serverTimestamp(),
        isRead: false,
    });
    
    return {
      message: 'Thank you for your message! We have received it and will get back to you soon.',
      isSuccess: true,
      errors: {},
    };
  } catch (error) {
    console.error('Contact form submission error:', error);
    return {
      message: 'An unexpected error occurred while sending your message. Please try again later.',
      isSuccess: false,
    };
  }
}
