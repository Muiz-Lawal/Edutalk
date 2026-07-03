// Report Email Template Generator

/**
 * Generate HTML email template for analytics reports
 */
exports.generateEmailTemplate = (reportData, reportType = 'summary') => {
  const { hostName, streamTitle, metrics, frequency } = reportData;

  let metricsHTML = '';
  if (reportType === 'summary') {
    metricsHTML = `
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Key Metrics</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Total Viewers</td>
            <td style="padding: 10px;">${metrics.totalViewers || 0}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Peak Viewers</td>
            <td style="padding: 10px;">${metrics.peakViewers || 0}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Avg Watch Time</td>
            <td style="padding: 10px;">${metrics.avgWatchTime || 0} min</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Engagement Score</td>
            <td style="padding: 10px;">${metrics.engagementScore || 0}/100</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Chat Messages</td>
            <td style="padding: 10px;">${metrics.totalMessages || 0}</td>
          </tr>
        </table>
      </div>
    `;
  } else {
    // Detailed report
    metricsHTML = `
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Complete Analytics Report</h3>
        <pre style="overflow-x: auto;">${JSON.stringify(metrics, null, 2)}</pre>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Analytics Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0 0 0;
          opacity: 0.9;
        }
        .content {
          background: white;
          padding: 20px;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        .cta-button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          margin: 20px 0;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Analytics Report</h1>
          <p>${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Report for ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="content">
          <p>Hello ${hostName || 'Host'},</p>
          
          <p>Here's your ${frequency} analytics summary for <strong>${streamTitle || 'your streams'}</strong>:</p>

          ${metricsHTML}

          <p>Keep up the great work! Continue to grow your audience and engage with your viewers.</p>

          <a href="https://edutalk.example.com/analytics" class="cta-button">
            View Full Analytics →
          </a>

          <div class="footer">
            <p>This is an automated report from EduTalk Analytics.</p>
            <p>&copy; 2026 EduTalk. All rights reserved.</p>
            <p>To manage your report preferences, visit your Dashboard Settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Generate summary of metrics for email
 */
exports.formatMetricsForEmail = (metrics) => {
  return {
    totalViewers: metrics.totalViewers || 0,
    peakViewers: metrics.peakViewers || 0,
    avgWatchTime: Math.round(metrics.avgWatchTime || 0),
    engagementScore: Math.round(metrics.engagementScore || 0),
    totalMessages: metrics.totalMessages || 0,
    uniqueChatters: metrics.uniqueChatters || 0,
  };
};

/**
 * Create email subject based on frequency
 */
exports.generateEmailSubject = (frequency, streamTitle) => {
  const dateStr = new Date().toLocaleDateString('default', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  return `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Report: ${streamTitle} - ${dateStr}`;
};
