import type { Metadata } from 'next';
// Removed Geist imports as they are in root layout
import '../globals.css'; 
import { Toaster } from '@/components/ui/toaster';


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
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 md:py-8">
          {children}
        </main>
      </div>
      <Toaster />
    </>
  );
}
