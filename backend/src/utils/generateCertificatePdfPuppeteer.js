import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

// certificate: { _id, studentName, className, issuedAt, certificateData }
export default async function generateCertificatePdfPuppeteer(certificate, outputFilePath){
  const outDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Certificate ${certificate._id}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #1f2937; }
    .container { width: 100%; max-width: 900px; margin: 40px auto; padding: 40px; border: 6px solid #b45309; background: linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%); }
    h1 { text-align: center; font-size: 32px; margin: 0 0 16px; }
    h2 { text-align: center; font-size: 28px; margin: 8px 0; }
    .intro { text-align: center; margin-top: 20px; font-size: 16px; color: #374151; }
    .details { margin-top: 32px; display:flex; justify-content:space-between; }
    .signature { text-align:center; margin-top:40px; }
    code { background:#f3f4f6; padding:4px 6px; border-radius:4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Certificate of Completion</h1>
    <div class="intro">This is to certify that</div>
    <h2>${escapeHtml(certificate.studentName)}</h2>
    <div class="intro">has successfully completed the course</div>
    <h2>${escapeHtml(certificate.className)}</h2>
    <div class="details">
      <div>Certificate No.: <strong>${escapeHtml(certificate._id.toString())}</strong></div>
      <div>Issued on: <strong>${new Date(certificate.issuedAt || Date.now()).toLocaleDateString()}</strong></div>
    </div>
    <div class="signature">
      <div style="margin-top:40px;">${escapeHtml(certificate.certificateData?.instructorName || 'EduTalk Instructor')}</div>
      <div style="font-size:12px;color:#6b7280;">EduTalk Certification Authority</div>
    </div>
    <div style="margin-top:20px;text-align:center;font-size:12px;color:#6b7280;">Verification code: <code>${escapeHtml(certificate.verificationCode || '')}</code></div>
  </div>
</body>
</html>`;

  // Launch puppeteer and render to PDF
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try{
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: outputFilePath, format: 'A4', landscape: true, printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' } });

    const stats = fs.statSync(outputFilePath);
    return { path: outputFilePath, size: stats.size };
  } finally {
    await browser.close();
  }
}

function escapeHtml(str){
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
