import type { GenerateTailoredResumeOutput } from '@/ai/schemas';
import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import jsPDF from 'jspdf';


export const handleDownloadDocx = async (resume: GenerateTailoredResumeOutput) => {
    const { name, candidateTitle, email, phone, linkedin, address, summary, workExperience, education, otherSections } = resume;
    
    const docChildren: Paragraph[] = [];

    // Header
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: name.toUpperCase(), bold: true, size: 48 })], // 24pt
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 },
    }));

    if (candidateTitle) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: candidateTitle.toUpperCase(), size: 22, color: "595959", characterSpacing: 2 * 20 })], // 11pt, gray, letter spacing
        alignment: AlignmentType.LEFT,
        spacing: { after: 120 }, // 6pt
      }));
    }

    const contactInfo = [phone, email, linkedin, address].filter(Boolean).join(' / ');
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: contactInfo, size: 20 })], // 10pt
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 }, // 12pt
    }));

    const createSection = (title: string) => {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, color: "595959", characterSpacing: 2 * 20 })],
        spacing: { after: 120, before: 120 },
        border: { bottom: { color: "auto", space: 1, value: "single", size: 4 } },
      }));
      docChildren.push(new Paragraph({ text: "", spacing: { after: 80 }})); // Spacer after title line
    };

    // Summary Section
    if (summary?.body) {
      createSection(summary.title);
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: summary.body, size: 20 })],
      }));
    }

    // Work Experience
    if (workExperience?.length > 0) {
      createSection("Work Experience");
      workExperience.forEach(job => {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `${job.jobTitle} / ${job.company}`, bold: true, size: 22 })],
          spacing: { before: 120 },
        }));
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `${job.dates} / ${job.location}`, italics: true, size: 20 })],
          spacing: { after: 60 },
        }));
        job.description.forEach(desc => {
          docChildren.push(new Paragraph({
            text: desc,
            bullet: { level: 0 },
            indent: { left: 720, hanging: 360 },
            spacing: { after: 60 },
          }));
        });
      });
    }

    // Education
    if (education?.length > 0) {
      createSection("Education");
      education.forEach(edu => {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: edu.degree, bold: true, size: 22 })],
          spacing: { before: 120 },
        }));
        const eduDetails = [edu.dates, edu.school, edu.location].filter(Boolean).join(' / ');
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: eduDetails, size: 20 })],
          spacing: { after: 60 },
        }));
        edu.details?.forEach(detail => {
          docChildren.push(new Paragraph({
            text: detail,
            bullet: { level: 0 },
            indent: { left: 720, hanging: 360 },
            spacing: { after: 60 },
          }));
        });
      });
    }
    
    // Other Sections
    otherSections?.forEach(section => {
        createSection(section.title);
        section.body.split('\n').forEach(line => {
            const isBullet = line.startsWith('- ') || line.startsWith('* ');
            const text = isBullet ? line.substring(2) : line;
            docChildren.push(new Paragraph({
                text: text,
                bullet: isBullet ? { level: 0 } : undefined,
                indent: isBullet ? { left: 720, hanging: 360 } : undefined,
                spacing: { after: 60 },
            }));
        });
    });

    const doc = new DocxDocument({ 
        sections: [{ children: docChildren }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated-resume.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const handleDownloadPdf = (resume: GenerateTailoredResumeOutput) => {
    const { name, candidateTitle, email, phone, linkedin, address, summary, workExperience, education, otherSections } = resume;
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

    doc.save('generated-resume.pdf');
};
