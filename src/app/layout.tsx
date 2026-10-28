import type { Metadata } from 'next';
import { Newsreader, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { BRAND } from '@/lib/brand';

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-editorial',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.systemName}`,
    template: `%s | ${BRAND.name}`,
  },
  description: `${BRAND.name} PC parts sales and payments monitoring system.`,
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full ${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="h-full flex flex-col font-sans bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
