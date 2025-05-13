import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, UserCheck, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  stepNumber: string;
}

const steps: Step[] = [
  {
    icon: UploadCloud,
    title: 'Define Your Role',
    description: 'Easily upload your job description or define key competencies for the AI.',
    stepNumber: '1',
  },
  {
    icon: UserCheck,
    title: 'Candidate Interview',
    description: 'Candidates take an automated voice interview at their convenience, 24/7.',
    stepNumber: '2',
  },
  {
    icon: FileText,
    title: 'Review & Hire',
    description: 'Get detailed summaries, scores, and insights to make informed hiring decisions.',
    stepNumber: '3',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Get Started in 3 Simple Steps
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/70">
            VocaHire simplifies your interview process, making it efficient and effective.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <Card className="bg-card text-card-foreground shadow-lg h-full rounded-xl overflow-hidden">
                <CardHeader className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">
                      {step.stepNumber}
                    </div>
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="mt-4 text-xl font-semibold">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 text-base">
                  <p>{step.description}</p>
                </CardContent>
              </Card>
              {index < steps.length - 1 && (
                 <div className="hidden md:block absolute top-1/2 left-full w-16 transform -translate-y-1/2">
                  <svg width="100%" height="2" viewBox="0 0 64 2" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-border">
                    <line x1="0" y1="1" x2="64" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
