/**
 * @fileOverview Shared Zod schemas for AI flows.
 */

import { z } from 'zod';

export const WorkExperienceItemSchema = z.object({
  jobTitle: z.string().describe("The job title."),
  company: z.string().describe("The company name."),
  location: z.string().describe("The location of the job."),
  dates: z.string().describe("The start and end dates of employment."),
  description: z.array(z.string()).describe("A list of achievements or responsibilities, where each string is a bullet point."),
});

export const EducationItemSchema = z.object({
  degree: z.string().describe("The degree or certificate obtained."),
  school: z.string().describe("The name of the school or university."),
  location: z.string().optional().describe("The location of the school."),
  dates: z.string().optional().describe("The dates of attendance or graduation date."),
  details: z.array(z.string()).optional().describe("A list of additional details like honors or GPA, where each string is a bullet point."),
});

export const GenericSectionSchema = z.object({
  title: z.string(),
  body: z.string().describe("The content of the section as a single block of text. Can contain markdown for lists."),
});

export const GenerateTailoredResumeOutputSchema = z.object({
  name: z.string().describe("The full name of the candidate."),
  candidateTitle: z.string().describe("The candidate's professional title, to be displayed under their name (e.g., 'Creative Director')."),
  email: z.string().describe("The candidate's email address."),
  phone: z.string().describe("The candidate's phone number."),
  linkedin: z.string().optional().describe("A link to the candidate's LinkedIn profile."),
  address: z.string().optional().describe("The candidate's city, state, and zip code."),
  summary: z.object({
      title: z.string().describe("The title for the summary section (e.g., 'Career Objective', 'Professional Summary')."),
      body: z.string().describe("The summary content as a paragraph."),
  }),
  workExperience: z.array(WorkExperienceItemSchema).describe("A list of all work experience entries, ordered from most to least recent."),
  education: z.array(EducationItemSchema).describe("A list of all education entries."),
  otherSections: z.array(GenericSectionSchema).optional().describe("Any other sections from the resume, such as 'Skills' or 'Projects'."),
  fullResumeText: z
    .string()
    .describe('The full, rewritten resume, tailored for the job description, as a single block of well-formatted text. This is a fallback and for previewing.'),
});
export type GenerateTailoredResumeOutput = z.infer<typeof GenerateTailoredResumeOutputSchema>;
