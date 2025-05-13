'use server';

/**
 * @fileOverview Summarizes candidate responses to interview questions, highlighting key skills and experience.
 *
 * - summarizeCandidateResponses - A function that summarizes candidate responses.
 * - SummarizeCandidateResponsesInput - The input type for the summarizeCandidateResponses function.
 * - SummarizeCandidateResponsesOutput - The return type for the summarizeCandidateResponses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCandidateResponsesInputSchema = z.object({
  question: z.string().describe('The interview question asked to the candidate.'),
  response: z.string().describe('The candidate\'s response to the interview question.'),
});
export type SummarizeCandidateResponsesInput = z.infer<typeof SummarizeCandidateResponsesInputSchema>;

const SummarizeCandidateResponsesOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the candidate\'s response, highlighting key skills and relevant experience.'),
});
export type SummarizeCandidateResponsesOutput = z.infer<typeof SummarizeCandidateResponsesOutputSchema>;

export async function summarizeCandidateResponses(input: SummarizeCandidateResponsesInput): Promise<SummarizeCandidateResponsesOutput> {
  return summarizeCandidateResponsesFlow(input);
}

const summarizeCandidateResponsesPrompt = ai.definePrompt({
  name: 'summarizeCandidateResponsesPrompt',
  input: {schema: SummarizeCandidateResponsesInputSchema},
  output: {schema: SummarizeCandidateResponsesOutputSchema},
  prompt: `You are an expert recruiter summarizing candidate responses to interview questions. Your goal is to efficiently evaluate candidates by identifying key skills and relevant experience from their answers.

Summarize the following candidate response to the question, highlighting the key skills and experience mentioned. Be concise and focus on the most important aspects of the response.

Question: {{{question}}}
Response: {{{response}}}`,
});

const summarizeCandidateResponsesFlow = ai.defineFlow(
  {
    name: 'summarizeCandidateResponsesFlow',
    inputSchema: SummarizeCandidateResponsesInputSchema,
    outputSchema: SummarizeCandidateResponsesOutputSchema,
  },
  async input => {
    const {output} = await summarizeCandidateResponsesPrompt(input);
    return output!;
  }
);
