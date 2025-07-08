'use server';
/**
 * @fileOverview Flow to generate a resume from structured form data.
 *
 * - generateResumeFromForm - A function that creates a resume from user-provided details.
 * - GenerateResumeFromFormInput - The input type for the function.
 * - GenerateResumeFromFormOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateTailoredResumeOutput, GenerateTailoredResumeOutputSchema } from '@/ai/schemas';

const GenerateResumeFromFormInputSchema = z.object({
  name: z.string(),
  candidateTitle: z.string(),
  email: z.string(),
  phone: z.string(),
  linkedin: z.string().optional(),
  address: z.string().optional(),
  summary: z.string(),
  workExperience: z.array(z.object({
    jobTitle: z.string(),
    company: z.string(),
    location: z.string(),
    dates: z.string(),
    description: z.array(z.string()),
  })),
  education: z.array(z.object({
    degree: z.string(),
    school: z.string(),
    location: z.string().optional(),
    dates: z.string().optional(),
  })),
  skills: z.string(),
  otherSections: z.array(z.object({
    title: z.string(),
    body: z.string(),
  })).optional(),
});
export type GenerateResumeFromFormInput = z.infer<typeof GenerateResumeFromFormInputSchema>;

export type GenerateResumeFromFormOutput = GenerateTailoredResumeOutput;

export async function generateResumeFromForm(
  input: GenerateResumeFromFormInput
): Promise<GenerateResumeFromFormOutput> {
  return generateResumeFromFormFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateResumeFromFormPrompt',
  input: {schema: GenerateResumeFromFormInputSchema},
  output: {schema: GenerateTailoredResumeOutputSchema},
  prompt: `You are an expert resume writer and career coach. A user has provided their information in a structured JSON format. Your task is to assemble this information into a polished, professional, and ATS-friendly resume.

**Instructions:**
1.  **Review and Refine:** Read all the provided data.
2.  **Impactful Language:** For each work experience description, rewrite the provided bullet points to be more impactful. Start each bullet point with a strong action verb. Quantify achievements with numbers and metrics where possible.
3.  **Professional Summary:** Craft a compelling professional summary from the user's input.
4.  **Skills Section:** Format the skills string into a clean, readable list under a "Key Skills" or similar section title.
5.  **Assemble into Schema:** Populate the output JSON schema with the refined information.
    - Create the 'header' section from the personal details.
    - Create the 'summary' section.
    - Create the 'workExperience' array.
    - Create the 'education' array.
    - Create a dedicated 'Skills' section in 'otherSections' from the user's skills string. If the user provided other custom sections, include them as well.
    - Generate the 'fullResumeText' field by combining all the structured data into a single, well-formatted string that mimics a classic resume layout.

**User-Provided Data:**
- Name: {{{name}}}
- Title: {{{candidateTitle}}}
- Contact: {{{email}}}, {{{phone}}}{{#if linkedin}}, {{{linkedin}}}{{/if}}{{#if address}}, {{{address}}}{{/if}}
- Summary: {{{summary}}}

- Work Experience:
{{#each workExperience}}
  - Title: {{jobTitle}}
  - Company: {{company}}
  - Location: {{location}}
  - Dates: {{dates}}
  - Responsibilities:
  {{#each description}}
    - {{this}}
  {{/each}}
{{/each}}

- Education:
{{#each education}}
  - Degree: {{degree}} at {{school}}{{#if location}}, {{location}}{{/if}}{{#if dates}}, {{dates}}{{/if}}
{{/each}}

- Skills: {{{skills}}}

{{#if otherSections}}
- Other Sections:
{{#each otherSections}}
  - Title: {{title}}
  - Content: {{body}}
{{/each}}
{{/if}}
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const generateResumeFromFormFlow = ai.defineFlow(
  {
    name: 'generateResumeFromFormFlow',
    inputSchema: GenerateResumeFromFormInputSchema,
    outputSchema: GenerateTailoredResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
