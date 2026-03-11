import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import './globals.css';

export const metadata: Metadata = {
  title: 'DMDS — Dynamic Module Data System',
  description: 'Manage API keys and dynamic module permissions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <AntdRegistry>{children}</AntdRegistry>
        </ClerkProvider>
      </body>
    </html>
  );
}
