import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'EventTrust Nigeria - Find Verified Event Vendors in Lagos',
  description:
    'Find trustworthy caterers, photographers, venues, and more for your events in Lagos. All vendors verified.',
  openGraph: {
    title: 'EventTrust Nigeria',
    description: 'Find Verified Event Vendors in Lagos',
    siteName: 'EventTrust Nigeria',
    locale: 'en_NG',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
