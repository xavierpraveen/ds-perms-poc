import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'DMDS — Dynamic Module Data System',
  description: 'Manage API keys and dynamic module permissions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
