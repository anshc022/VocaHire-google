import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section id="hero" className="relative py-20 md:py-32 bg-gradient-to-br from-background to-secondary">
      <div className="absolute inset-0 opacity-10">
        {/* Optional: Add a subtle background pattern or image here */}
        {/* <Image src="/path-to-subtle-pattern.svg" layout="fill" objectFit="cover" alt="Background pattern" /> */}
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl">
          VocaHire
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-foreground/80 sm:text-xl md:text-2xl">
          Revolutionize Your Hiring with Real-Time AI Voice Interviews. <br className="hidden sm:inline" />
          Smarter, Faster, Fairer.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Button 
            asChild 
            size="lg" 
            className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg px-10 py-6 text-lg rounded-lg"
          >
            <Link href="/interview">Start Your Free Interview</Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="border-primary text-primary hover:bg-primary/10 transition-all duration-300 ease-in-out hover:scale-105 px-10 py-6 text-lg rounded-lg"
          >
            <Link href="#demo">Watch Demo</Link>
          </Button>
        </div>
        <div className="mt-16">
          <Image 
            src="https://picsum.photos/1200/600"
            alt="VocaHire App Preview"
            width={1000}
            height={500}
            className="rounded-xl shadow-2xl mx-auto ring-1 ring-border"
            data-ai-hint="dashboard application"
            priority
          />
        </div>
      </div>
    </section>
  );
}
