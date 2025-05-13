import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css'; // Adjusted path for globals.css
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VocaHire Interview',
  description: 'Take your AI-powered voice interview with VocaHire.',
};

export default function InterviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}>
        <div className="flex flex-col min-h-screen">
          {/* Minimal layout, can add a simple header/footer if needed later */}
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
