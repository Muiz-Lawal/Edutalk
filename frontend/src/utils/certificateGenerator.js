/**
 * PDF Certificate Generator using HTML2PDF library
 * Install: npm install html2pdf.js
 */

export const generateCertificatePDF = async (certificate) => {
  try {
    // Dynamically import html2pdf if not already loaded
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const {
      certificateNumber,
      studentName,
      className,
      completionDate,
      verificationCode,
      issueDate,
      template = 'classic'
    } = certificate;

    // Create certificate HTML
    const certificateHTML = `
      <div style="
        width: 100%;
        height: 100%;
        padding: 40px 60px;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border: 4px solid #b45309;
        font-family: 'Times New Roman', serif;
        text-align: center;
        box-sizing: border-box;
      ">
        <div style="margin-bottom: 40px;">
          <div style="font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px;">
            EduTalk
          </div>
          <h1 style="font-size: 48px; font-weight: bold; color: #1f2937; margin: 20px 0;">
            Certificate of Completion
          </h1>
        </div>

        <div style="margin: 40px 0; font-size: 16px; color: #4b5563; line-height: 1.8;">
          <p>This is to certify that</p>
          <h2 style="font-size: 36px; color: #1f2937; text-decoration: underline; text-decoration-style: dotted; margin: 20px 0;">
            ${studentName}
          </h2>
          <p>has successfully completed the course</p>
          <h3 style="font-size: 24px; color: #374151; font-style: italic; margin: 20px 0;">
            ${className}
          </h3>
          <p>with dedication and excellence</p>
        </div>

        <div style="display: flex; justify-content: space-around; margin: 40px 0; font-size: 14px;">
          <div>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-weight: bold;">DATE OF COMPLETION</p>
            <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: bold;">
              ${new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-weight: bold;">CERTIFICATE NO.</p>
            <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: bold;">
              ${certificateNumber}
            </p>
          </div>
        </div>

        <div style="margin: 40px 0; padding: 12px; background: rgba(0, 0, 0, 0.02); border-radius: 4px;">
          <p style="margin: 0; font-size: 12px; color: #4b5563;">
            Verification Code: <code style="font-family: 'Courier New', monospace; font-weight: bold; color: #1f2937; background: rgba(0, 0, 0, 0.05); padding: 2px 6px; border-radius: 3px;">
              ${verificationCode}
            </code>
          </p>
        </div>

        <div style="margin-top: 60px;">
          <div style="height: 2px; width: 200px; margin: 0 auto 8px; background: #6b7280;"></div>
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1f2937;">
            EduTalk Certification Authority
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
            Issued on ${new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    `;

    // Create a temporary container
    const element = document.createElement('div');
    element.innerHTML = certificateHTML;
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1200px';
    element.style.height = '900px';
    document.body.appendChild(element);

    // PDF options
    const options = {
      margin: 10,
      filename: `Certificate_${studentName}_${certificateNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: [297, 210] } // A4 landscape
    };

    // Generate PDF
    await window.html2pdf().set(options).from(element).save();

    // Cleanup
    document.body.removeChild(element);

    return {
      success: true,
      message: 'Certificate downloaded successfully'
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate PDF'
    };
  }
};

/**
 * Alternative: Server-side PDF generation
 * Call backend endpoint that uses jsPDF or similar
 */
export const generateCertificateServerSide = async (certificateId, token) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/certificates/${certificateId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download certificate (${response.status})`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate_${certificateId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return {
      success: true,
      message: 'Certificate downloaded successfully'
    };
  } catch (error) {
    console.error('Certificate download error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  generateCertificatePDF,
  generateCertificateServerSide
};
