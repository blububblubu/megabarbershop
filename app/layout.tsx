import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'SETARA Barbershop — Booking Online',
  description:
    'Website resmi dan sistem booking slot waktu online SETARA Barbershop.',
  icons: {
    icon: '/images/logo.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className="min-h-screen font-sans bg-brand-bg text-brand-charcoal">
        {children}
      </body>
    </html>
  );
}

