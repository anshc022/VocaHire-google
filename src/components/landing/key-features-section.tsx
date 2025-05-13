import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Mic, FileQuestion, Sparkles, BarChartBig, Settings2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Bot,
    title: 'Real-Time AI Analysis',
    description: 'Get instant insights into candidate responses with our advanced AI.',
  },
  {
    icon: Mic,
    title: 'Natural Voice Interaction',
    description: 'Candidates engage in a conversational interview experience.',
  },
  {
    icon: FileQuestion,
    title: 'Adaptive Questioning',
    description: 'AI tailors questions based on role requirements and candidate answers.',
  },
  {
    icon: Sparkles,
    title: 'Instant Feedback & Scoring',
    description: 'Objective scoring and feedback to reduce bias and save time.',
  },
  {
    icon: BarChartBig,
    title: 'Detailed Analytics',
    description: 'Comprehensive reports on candidate performance and key metrics.',
  },
  {
    icon: Settings2,
    title: 'Customizable Interviews',
    description: 'Tailor interview scripts and evaluation criteria to your needs.',
  },
];

export function KeyFeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Why Choose VocaHire?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/70">
            Discover the powerful features that make VocaHire the ultimate AI interviewing tool.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="bg-card text-card-foreground shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out rounded-xl overflow-hidden"
            >
              <CardHeader className="flex flex-row items-center space-x-4 p-6 bg-secondary/50">
                <feature.icon className="h-10 w-10 text-primary" />
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-base">
                <p>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
