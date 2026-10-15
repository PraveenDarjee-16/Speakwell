import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SpeakWell - Speak Better. Think Clearly. Grow Confidently.',
  description: 'AI-guided English communication learning platform. Practice 100+ extempore topics, mock interviews, and daily vocabulary with objective rubric evaluations.',
  keywords: [
    'English communication',
    'extempore practice',
    'AI speech analysis',
    'job interview preparation',
    'STAR method interview',
    'public speaking',
    'vocabulary builder',
    'pronunciation practice'
  ],
  authors: [{ name: 'SpeakWell Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark h-full antialiased ${inter.className}`}>
      <body className="min-h-full flex flex-col bg-[#09090b] text-[#fafafa]">
        <Navbar />
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
