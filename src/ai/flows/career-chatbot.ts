'use server';
/**
 * @fileOverview A career assistant chatbot flow.
 *
 * - careerChat - A function that handles a single turn in a conversation.
 * - CareerChatInput - The input type for the careerChat function.
 * - CareerChatOutput - The return type for the careerChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateTailoredResumeOutputSchema } from '@/ai/schemas';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const CareerChatInputSchema = z.object({
  messages: z.array(MessageSchema).describe("The full conversation history, including the latest user message."),
});
export type CareerChatInput = z.infer<typeof CareerChatInputSchema>;

const CareerChatOutputSchema = z.object({
  response: z.string().describe("The chatbot's response."),
  resumeData: GenerateTailoredResumeOutputSchema.optional().describe("The structured resume data, generated when the user confirms the resume is complete."),
});
export type CareerChatOutput = z.infer<typeof CareerChatOutputSchema>;

export async function careerChat(input: CareerChatInput): Promise<CareerChatOutput> {
  return careerChatFlow(input);
}

const careerChatFlow = ai.defineFlow(
  {
    name: 'careerChatFlow',
    inputSchema: CareerChatInputSchema,
    outputSchema: CareerChatOutputSchema,
  },
  async ({ messages }) => {
    const systemPrompt = `You are ResuMate, a friendly and expert career assistant chatbot. Your main goal is to help users create a professional resume from scratch by guiding them through a series of questions.

**Your Task:**
1.  **Ask One Question at a Time:** Guide the user step-by-step. After they answer, briefly acknowledge it and ask the next logical question. Do not ask for everything at once.
2.  **Follow this Sequence:**
    - Start by asking for the target **job description**.
    - Full Name
    - Candidate Title (e.g., "Software Engineer")
    - Email Address
    - Phone Number
    - LinkedIn Profile URL (optional)
    - Address (City, State)
    - Professional Summary/Objective
    - Work Experience (for each job: Title, Company, Location, Dates, and bulleted list of Responsibilities/Achievements). Ask for one job at a time.
    - Education (for each degree: Degree, School, Location, Dates). Ask for one degree at a time.
    - Key Skills (as a list).
3.  **Job Suggestions:** If a user asks for job suggestions instead of creating a resume, ask about their skills and interests to provide relevant roles.
4.  **Completion:** When the user indicates they have provided all their information (e.g., "I'm done" or "that's everything"), you MUST parse the *entire* conversation history. Construct a complete, structured resume object according to the 'resumeData' schema.
5.  **Final Message:** When you generate the 'resumeData', your 'response' MUST be a final confirmation message like: "Great! I've created your resume. You can now download it as a PDF."
6.  **Important:** If the resume is not yet complete, you MUST NOT generate the 'resumeData' field.`;

    const history = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];

    const result = await ai.generate({
      system: systemPrompt,
      history: history,
      prompt: lastMessage.content,
      output: {
        format: 'json',
        schema: CareerChatOutputSchema,
      },
       config: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
      },
    });

    return result.output!;
  }
);
