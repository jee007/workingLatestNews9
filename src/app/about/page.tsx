import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'About Us | LatestNews9.com',
  description: 'Learn more about LatestNews9.com, your AI-powered multilingual news source.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">About LatestNews9.com</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-lg leading-relaxed">
          <p>
            Welcome to LatestNews9.com, your premier destination for up-to-the-minute news from around the globe, powered by cutting-edge artificial intelligence. Our mission is to break down language barriers and deliver timely, relevant news to a diverse, international audience.
          </p>
          <p>
            In today's fast-paced world, staying informed is more important than ever. However, access to news is often fragmented by region and language. We created LatestNews9.com to solve this problem. Our advanced AI systems scan thousands of reputable sources worldwide, curating the most important stories across categories like National, World, Business, Technology, Entertainment, and Sports.
          </p>
          <h2 className="font-headline text-2xl pt-4">Our Technology</h2>
          <p>
            Our platform leverages state-of-the-art AI to not only gather news but also to enhance it. We generate concise summaries to give you the key points at a glance and offer full-length articles for a deeper dive. For those who prefer to listen, our text-to-speech feature can convert articles into audio, making it easy to catch up on the news while on the go.
          </p>
          <h2 className="font-headline text-2xl pt-4">Our Commitment</h2>
          <p>
            We are committed to providing a seamless and accessible user experience. Our site is designed to be clean, fast, and easy to navigate on any device. We believe in the power of information to connect people and cultures, and we are proud to offer a platform that makes global news accessible to everyone.
          </p>
          <p>
            Thank you for choosing LatestNews9.com. We are constantly working to improve our service and bring you the best AI-driven news experience possible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
