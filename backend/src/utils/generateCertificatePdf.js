import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// certificate: { _id, studentName, className, issuedAt, certificateData }
export default function generateCertificatePdf(certificate, outputFilePath){
  return new Promise((resolve, reject) => {
    try{
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 48 });
      const outDir = path.dirname(outputFilePath);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const stream = fs.createWriteStream(outputFilePath);
      doc.pipe(stream);

      // Background
      doc.rect(0,0, doc.page.width, doc.page.height).fill('#ffffff');

      // Title
      doc.fillColor('#333').fontSize(36).font('Times-Bold');
      doc.text('Certificate of Completion', { align: 'center', underline: true });

      doc.moveDown(1.5);

      // Presented to
      doc.fontSize(20).font('Times-Roman').fillColor('#444');
      doc.text('Presented to', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(30).font('Times-Bold').fillColor('#000');
      doc.text(certificate.studentName || 'Student Name', { align: 'center' });

      doc.moveDown(1.0);
      doc.fontSize(18).font('Times-Roman').fillColor('#333');
      doc.text(`For successfully completing the course:`, { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(22).font('Times-Bold').fillColor('#000');
      doc.text(certificate.className || 'Class Title', { align: 'center' });

      doc.moveDown(1.5);
      const issuedAt = certificate.issuedAt ? new Date(certificate.issuedAt) : new Date();
      doc.fontSize(12).font('Times-Roman').fillColor('#666');
      doc.text(`Issued on: ${issuedAt.toDateString()}`, { align: 'center' });

      // Signature area
      const sigY = doc.page.height - 120;
      doc.moveTo(120, sigY).lineTo(320, sigY).stroke('#000');
      doc.fontSize(12).text('Instructor Signature', 120, sigY + 6, { width: 200, align: 'center' });

      doc.moveTo(doc.page.width - 320, sigY).lineTo(doc.page.width - 120, sigY).stroke('#000');
      doc.text('EduTalk', doc.page.width - 320, sigY + 6, { width: 200, align: 'center' });

      doc.end();

      stream.on('finish', () => {
        const stats = fs.statSync(outputFilePath);
        resolve({ path: outputFilePath, size: stats.size });
      });
      stream.on('error', (err)=> reject(err));
    }catch(err){
      reject(err);
    }
  });
}
