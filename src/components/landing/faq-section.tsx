"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is VocaHire?",
    answer:
      "VocaHire is an AI-powered voice interviewing tool that helps companies streamline their hiring process. It conducts initial screening interviews using natural voice conversations, providing objective analysis and insights to hiring teams.",
  },
  {
    question: "How does the AI work?",
    answer:
      "Our AI uses advanced Natural Language Processing (NLP) and machine learning models to understand candidate responses, assess skills, and identify key competencies. It can adapt questions and provide consistent, unbiased evaluations.",
  },
  {
    question: "Is VocaHire customizable?",
    answer:
      "Yes! You can customize interview scripts, define specific skills and competencies to evaluate, and tailor the scoring criteria to match your organization's unique needs and job roles.",
  },
  {
    question: "How does VocaHire ensure fairness and reduce bias?",
    answer:
      "VocaHire focuses on objective criteria and standardized questioning. The AI evaluates responses based on predefined metrics, minimizing human subjectivity often present in initial screenings. This helps create a more equitable hiring process.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/70">
            Find answers to common questions about VocaHire.
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border-b border-border last:border-b-0">
                <AccordionTrigger className="py-6 text-left text-lg font-medium hover:no-underline text-foreground data-[state=open]:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base text-foreground/80">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
