'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { careerChat, type CareerChatInput } from '@/ai/flows/career-chatbot';
import jsPDF from 'jspdf';
import type { GenerateTailoredResumeOutput } from '@/ai/schemas';

import { ArrowLeft, Bot, Send, User, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I'm ResuMate, your AI career assistant. I can help you build a resume from scratch. To get started, please paste in the job description for the role you're targeting.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<GenerateTailoredResumeOutput | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // Using `lastElementChild` to get the last message element
        const lastElement = scrollAreaRef.current.querySelector('.space-y-6 > div:last-child');
        lastElement?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleDownloadPdf = () => {
    if (!generatedResume) return;

    const { name, candidateTitle, email, phone, linkedin, address, summary, workExperience, education, otherSections } = generatedResume;
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 40;
    const lineSpacing = 1.2;
    const sectionSpacing = 20;
    
    const checkPageBreak = (spaceNeeded: number) => {
        if (yPos + spaceNeeded > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = margin;
        }
    };

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(name.toUpperCase(), margin, yPos);
    yPos += 24;

    if (candidateTitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(89, 89, 89);
      doc.text(candidateTitle.toUpperCase(), margin, yPos, { charSpace: 2 });
      yPos += 20;
    }

    const contactInfo = [phone, email, linkedin, address].filter(Boolean).join(' / ');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(contactInfo, margin, yPos);
    yPos += sectionSpacing;

    const printSectionTitle = (title: string) => {
        checkPageBreak(30);
        yPos += sectionSpacing / 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(89, 89, 89);
        doc.text(title.toUpperCase(), margin, yPos, { charSpace: 2 });
        yPos += 8;
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;
    };
    
    // Summary
    if (summary?.body) {
        printSectionTitle(summary.title);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const summaryLines = doc.splitTextToSize(summary.body, pageWidth - margin * 2);
        checkPageBreak(summaryLines.length * 10 * lineSpacing);
        doc.text(summaryLines, margin, yPos);
        yPos += summaryLines.length * 10 * lineSpacing;
    }

    // Work Experience
    if (workExperience?.length > 0) {
        printSectionTitle("Work Experience");
        workExperience.forEach(job => {
            checkPageBreak(60);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(`${job.jobTitle} / ${job.company}`, margin, yPos);
            yPos += 12;

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.text(`${job.dates} / ${job.location}`, margin, yPos);
            yPos += 15;

            doc.setFont('helvetica', 'normal');
            job.description.forEach(desc => {
                const bulletPoint = `• ${desc}`;
                const bulletLines = doc.splitTextToSize(bulletPoint, pageWidth - margin * 2 - 15);
                checkPageBreak(bulletLines.length * 10 * lineSpacing);
                doc.text(bulletLines, margin + 5, yPos);
                yPos += (bulletLines.length * 10 * lineSpacing) + 2;
            });
            yPos += 10;
        });
    }

    // Education
    if (education?.length > 0) {
        printSectionTitle("Education");
        education.forEach(edu => {
            checkPageBreak(40);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(edu.degree, margin, yPos);
            yPos += 12;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const eduDetails = [edu.dates, edu.school, edu.location].filter(Boolean).join(' / ');
            doc.text(eduDetails, margin, yPos);
            yPos += 15;
            
            edu.details?.forEach(detail => {
                const bulletPoint = `• ${detail}`;
                const bulletLines = doc.splitTextToSize(bulletPoint, pageWidth - margin * 2 - 15);
                checkPageBreak(bulletLines.length * 10 * lineSpacing);
                doc.text(bulletLines, margin + 5, yPos);
                yPos += (bulletLines.length * 10 * lineSpacing) + 2;
            });
             yPos += 10;
        });
    }

    // Other Sections
    otherSections?.forEach(section => {
        printSectionTitle(section.title);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        section.body.split('\n').forEach(line => {
            const isBullet = line.startsWith('- ') || line.startsWith('* ');
            const text = isBullet ? `• ${line.substring(2)}` : line;
            const indent = isBullet ? 5 : 0;
            const textLines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent);
            checkPageBreak(textLines.length * 10 * lineSpacing);
            doc.text(textLines, margin + indent, yPos);
            yPos += (textLines.length * 10 * lineSpacing) + 2;
        });
    });

    doc.save('chatbot-resume.pdf');
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setGeneratedResume(null);

    try {
      const result = await careerChat({ messages: newMessages });
      const modelMessage: Message = { role: 'model', content: result.response };
      setMessages((prev) => [...prev, modelMessage]);

      if (result.resumeData) {
        setGeneratedResume(result.resumeData);
      }

    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [...prev, {role: 'model', content: "Sorry, I ran into an error. Please try sending your message again."}]);
       toast({
        title: 'An Error Occurred',
        description: 'The chatbot could not respond. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12 flex flex-col min-h-screen">
       <div className="mb-4">
        <Link href="/" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resume Tailor
          </Button>
        </Link>
      </div>
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot /> ResuMate Chatbot
          </CardTitle>
          <CardDescription>Your personal AI career assistant to help you build a resume.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-[55vh] pr-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'model' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot size={20} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-sm rounded-lg p-3 text-sm md:max-w-md',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                   {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                       <AvatarFallback><User size={20} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex-wrap gap-2">
          <form onSubmit={handleSendMessage} className="flex flex-1 items-center space-x-2 min-w-[200px]">
            <Input
              id="message"
              placeholder="Type your message..."
              className="flex-1"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
          {generatedResume && (
            <Button onClick={handleDownloadPdf} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
