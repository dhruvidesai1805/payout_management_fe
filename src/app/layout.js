import './globals.css';
import Providers from '@/components/Providers';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'PayFlow — Payout Management',
  description: 'Payout Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
