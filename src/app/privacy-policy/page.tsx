import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Privacy Policy | LatestNews9.com',
  description: 'Read the privacy policy for LatestNews9.com.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <p>LatestNews9.com ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>

          <h2 className="font-headline text-2xl pt-4">Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name and email address, that you voluntarily give to us when you use our contact form.</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Site.</li>
            <li><strong>Third-Party Data:</strong> We may use third-party vendors, including Google, to serve ads when you visit the website. These companies may use information (not including your name, address, email address, or telephone number) about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.</li>
          </ul>

          <h2 className="font-headline text-2xl pt-4">Use of Your Information</h2>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Respond to your comments and questions and provide customer service.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
            <li>Deliver targeted advertising, coupons, newsletters, and other information regarding promotions and the Site to you.</li>
          </ul>

          <h2 className="font-headline text-2xl pt-4">Advertising</h2>
          <p>We use Google AdSense to serve advertisements on our site. Google uses cookies to serve ads based on a user's prior visits to your website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet. Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ads Settings</a>.</p>

          <h2 className="font-headline text-2xl pt-4">Security of Your Information</h2>
          <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

          <h2 className="font-headline text-2xl pt-4">Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us through our contact page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
