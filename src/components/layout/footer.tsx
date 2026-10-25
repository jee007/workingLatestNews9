import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-card">
      <div className="container mx-auto px-4 md:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} LatestNews9.com. All Rights Reserved.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
            Contact
          </Link>
          <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
