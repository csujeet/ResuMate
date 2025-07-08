'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GenerateTailoredResumeOutput } from '@/ai/schemas';
import { generateResumeFromForm } from '@/ai/flows/generate-resume-from-form';
import { useToast } from '@/hooks/use-toast';

import { ArrowLeft, PlusCircle, Trash2, Loader2, Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { handleDownloadDocx, handleDownloadPdf } from '@/lib/download';

const formSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  candidateTitle: z.string().min(1, 'Professional title is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  linkedin: z.string().url('Invalid URL.').optional().or(z.literal('')),
  address: z.string().optional(),
  summary: z.string().min(50, 'Summary should be at least 50 characters.').max(1000),
  workExperience: z.array(z.object({
    jobTitle: z.string().min(1, 'Job title is required.'),
    company: z.string().min(1, 'Company name is required.'),
    location: z.string().min(1, 'Location is required.'),
    dates: z.string().min(1, 'Dates are required.'),
    description: z.string().min(20, 'Description needs at least 20 characters.').max(2000, 'Description is too long.'),
  })).min(1, 'At least one work experience is required.'),
  education: z.array(z.object({
    degree: z.string().min(1, 'Degree is required.'),
    school: z.string().min(1, 'School name is required.'),
    location: z.string().optional(),
    dates: z.string().optional(),
  })).min(1, 'At least one education entry is required.'),
  skills: z.string().min(1, 'Please list at least one skill.'),
  otherSections: z.array(z.object({
    title: z.string().min(1, 'Section title is required.'),
    body: z.string().min(10, 'Section content is required.'),
  })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BuildResumePage() {
  const [generatedResume, setGeneratedResume] = useState<GenerateTailoredResumeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      candidateTitle: '',
      email: '',
      phone: '',
      linkedin: '',
      address: '',
      summary: '',
      workExperience: [{ jobTitle: '', company: '', location: '', dates: '', description: '' }],
      education: [{ degree: '', school: '', location: '', dates: '' }],
      skills: '',
      otherSections: [],
    },
  });

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control: form.control,
    name: 'workExperience',
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control: form.control,
    name: 'education',
  });

  const { fields: otherFields, append: appendOther, remove: removeOther } = useFieldArray({
    control: form.control,
    name: 'otherSections',
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedResume(null);

    const formattedData = {
      ...data,
      workExperience: data.workExperience.map(exp => ({...exp, description: exp.description.split('\n').filter(line => line.trim() !== '')})),
    }
    
    try {
      const result = await generateResumeFromForm(formattedData);
      setGeneratedResume(result);
      toast({
        title: "Resume Generated!",
        description: "Your resume has been created successfully. You can now download it.",
      });
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (error) {
      console.error('Error generating resume:', error);
      toast({
        title: 'An Error Occurred',
        description: 'Failed to generate your resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6">
        <Link href="/" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Your Resume</CardTitle>
          <CardDescription>Fill out the form below, and our AI will generate a professional resume for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <section>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="candidateTitle" render={({ field }) => ( <FormItem><FormLabel>Professional Title</FormLabel><FormControl><Input placeholder="Software Engineer" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="linkedin" render={({ field }) => ( <FormItem><FormLabel>LinkedIn URL (Optional)</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/johndoe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Input placeholder="San Francisco, CA" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Professional Summary</h3>
                <FormField control={form.control} name="summary" render={({ field }) => ( <FormItem><FormLabel>Summary/Objective</FormLabel><FormControl><Textarea placeholder="A brief overview of your career, skills, and goals..." className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </section>

              <Separator />

              <section>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Work Experience</h3>
                {workFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md relative mb-4 space-y-4">
                     <FormField control={form.control} name={`workExperience.${index}.jobTitle`} render={({ field }) => ( <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name={`workExperience.${index}.company`} render={({ field }) => ( <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name={`workExperience.${index}.location`} render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name={`workExperience.${index}.dates`} render={({ field }) => ( <FormItem><FormLabel>Dates (e.g., May 2020 - Present)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name={`workExperience.${index}.description`} render={({ field }) => ( <FormItem><FormLabel>Responsibilities & Achievements (one per line)</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     {workFields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => removeWork(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                     )}
                  </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendWork({ jobTitle: '', company: '', location: '', dates: '', description: '' })}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                 </Button>
              </section>

              <Separator />

              <section>
                 <h3 className="text-xl font-semibold mb-4 border-b pb-2">Education</h3>
                 {eduFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md relative mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name={`education.${index}.degree`} render={({ field }) => ( <FormItem><FormLabel>Degree/Certificate</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name={`education.${index}.school`} render={({ field }) => ( <FormItem><FormLabel>School/University</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name={`education.${index}.location`} render={({ field }) => ( <FormItem><FormLabel>Location (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name={`education.${index}.dates`} render={({ field }) => ( <FormItem><FormLabel>Dates (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        {eduFields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => removeEdu(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                 ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendEdu({ degree: '', school: '', location: '', dates: '' })}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                 </Button>
              </section>

              <Separator />
              
              <section>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Skills</h3>
                <FormField control={form.control} name="skills" render={({ field }) => ( <FormItem><FormLabel>Key Skills</FormLabel><FormControl><Textarea placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </section>

              <Separator />

              <section>
                 <h3 className="text-xl font-semibold mb-4 border-b pb-2">Additional Sections (Optional)</h3>
                 {otherFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md relative mb-4 space-y-4">
                       <FormField control={form.control} name={`otherSections.${index}.title`} render={({ field }) => ( <FormItem><FormLabel>Section Title</FormLabel><FormControl><Input placeholder="e.g., Certifications, Projects" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={form.control} name={`otherSections.${index}.body`} render={({ field }) => ( <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea className="min-h-[100px]" placeholder="Enter content for this section. Use bullet points by starting lines with a hyphen (-)." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => removeOther(index)}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                 ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendOther({ title: '', body: '' })}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Section
                 </Button>
              </section>

              <div className="text-center pt-8">
                 <Button type="submit" size="lg" disabled={isLoading}>
                   {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                   {isLoading ? 'Generating...' : 'Generate My Resume'}
                 </Button>
              </div>

            </form>
          </Form>

          {generatedResume && (
            <div className="mt-12 text-center">
              <Separator className="my-8" />
              <h3 className="text-2xl font-bold">Your Resume is Ready!</h3>
              <p className="text-muted-foreground mb-4">Download your professionally formatted resume below.</p>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button>
                          <Download className="mr-2" /> Download Resume <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleDownloadDocx(generatedResume)}>Download as DOCX</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadPdf(generatedResume)}>Download as PDF</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
