import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  company: string;
  avatarSrc: string;
  avatarFallback: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "VocaHire has revolutionized our screening process. We're identifying top talent faster than ever before!",
    name: 'Sarah L.',
    title: 'HR Manager',
    company: 'Tech Solutions Inc.',
    avatarSrc: 'https://picsum.photos/seed/sarah/100/100',
    avatarFallback: 'SL',
    rating: 5,
  },
  {
    quote: "The AI insights are incredibly accurate and have helped us reduce bias in our hiring. Highly recommended!",
    name: 'John B.',
    title: 'Recruitment Lead',
    company: 'Innovatech Corp.',
    avatarSrc: 'https://picsum.photos/seed/john/100/100',
    avatarFallback: 'JB',
    rating: 5,
  },
  {
    quote: "Our candidates love the flexibility of voice interviews, and we love the efficiency it brings to our team.",
    name: 'Emily W.',
    title: 'Talent Acquisition Specialist',
    company: 'Global Connect Ltd.',
    avatarSrc: 'https://picsum.photos/seed/emily/100/100',
    avatarFallback: 'EW',
    rating: 4,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-16 sm:py-20 lg:py-24 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Trusted by Hiring Teams
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/70">
            See what our users are saying about VocaHire.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.name} 
              className="bg-card text-card-foreground shadow-lg flex flex-col rounded-xl overflow-hidden"
            >
              <CardContent className="p-6 flex-grow flex flex-col">
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <blockquote className="italic text-lg text-foreground/90 mb-6 flex-grow">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center mt-auto">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={testimonial.avatarSrc} alt={testimonial.name} data-ai-hint="person avatar" />
                    <AvatarFallback>{testimonial.avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-base">{testimonial.name}</p>
                    <p className="text-sm text-foreground/70">{testimonial.title}, {testimonial.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
