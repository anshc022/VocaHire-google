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
    // Removed <html> and <body> tags as they are handled by the root layout
    // Ensured className is applied to a div or fragment if necessary,
    // but for a layout, children are directly rendered within the parent's body.
    // The font variables are already applied in the root layout.
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Minimal layout, can add a simple header/footer if needed later */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
      <Toaster />
    </>
  );
}
