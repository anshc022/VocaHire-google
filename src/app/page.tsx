import { Navbar } from '@/components/layout/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { KeyFeaturesSection } from '@/components/landing/key-features-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { DemoPreviewSection } from '@/components/landing/demo-preview-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { FAQSection } from '@/components/landing/faq-section';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <KeyFeaturesSection />
        <HowItWorksSection />
        <DemoPreviewSection />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
