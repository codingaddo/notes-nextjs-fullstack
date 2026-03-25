import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Purple Notes',
  description: 'Fast, minimal notes app powered by Next.js and Prisma.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
