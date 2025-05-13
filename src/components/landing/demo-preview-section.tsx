import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlayCircle, Mic } from 'lucide-react';

export function DemoPreviewSection() {
  return (
    <section id="demo" className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            See VocaHire in Action
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/70">
            Experience how our AI-powered voice interviews can transform your hiring process.
          </p>
        </div>
        
        <div className="relative bg-card p-8 rounded-xl shadow-2xl border border-border max-w-4xl mx-auto">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            <Image 
              src="https://picsum.photos/seed/vocahire-demo/1280/720"
              alt="VocaHire Demo Preview"
              width={1280}
              height={720}
              className="object-cover w-full h-full"
              data-ai-hint="video player interface"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Button variant="ghost" size="lg" className="text-white hover:bg-white/20 p-4 rounded-full h-auto">
                <PlayCircle className="h-16 w-16" />
              </Button>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-lg text-foreground/80 mb-4">
              Imagine a seamless interview experience, where AI asks the right questions and provides instant, unbiased analysis.
            </p>
            <div className="flex justify-center items-center space-x-4 p-4 bg-secondary rounded-lg max-w-md mx-auto">
              <Mic className="h-8 w-8 text-primary" />
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-foreground/70 whitespace-nowrap">"Tell me about a time you..."</p>
            </div>
            <Button 
              size="lg" 
              className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 ease-in-out hover:scale-105"
            >
              Request a Personalized Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
