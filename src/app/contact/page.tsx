'use client';

import { useFormStatus } from 'react-dom';
import { submitContactForm, type ContactFormState } from './actions';
import { useActionState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Send Message
    </Button>
  );
}

export default function ContactPage() {
  const initialState: ContactFormState = { message: '', isSuccess: false };
  const [state, formAction] = useActionState(submitContactForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.isSuccess) {
      toast({
        title: 'Message Sent!',
        description: state.message,
      });
      formRef.current?.reset();
    } else if (state.message && (state.errors || !state.isSuccess)) {
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Contact Us</CardTitle>
          <CardDescription>
            Have a question, feedback, or a news tip? We'd love to hear from you. Fill out the form below to get in touch with our team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required />
              {state.errors?.name && <p className="text-sm font-medium text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
               {state.errors?.email && <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea id="message" name="message" placeholder="Please type your message here..." required rows={6} />
              {state.errors?.message && <p className="text-sm font-medium text-destructive">{state.errors.message[0]}</p>}
            </div>
            <div>
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
