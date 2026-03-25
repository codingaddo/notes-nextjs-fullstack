import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Notes App',
  description: 'Fullstack notes app built with Next.js and Prisma',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
