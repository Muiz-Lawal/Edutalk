import React, { useEffect, useRef } from 'react';
import '../styles/ProgressChart.css';

const ProgressChart = ({ data = [], title = 'Progress Over Time', height = 300 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = height;

    // Calculate scales
    const maxValue = Math.max(...data.map(d => d.value || 0), 100);
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw data line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      const y = canvas.height - padding - (point.value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#3b82f6';
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      const y = canvas.height - padding - (point.value / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // X-axis labels
    const labelStep = Math.max(1, Math.floor(data.length / 5));
    data.forEach((point, index) => {
      if (index % labelStep === 0 || index === data.length - 1) {
        const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
        ctx.fillText(point.label || `Day ${index + 1}`, x, canvas.height - padding + 20);
      }
    });

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((i / 5) * maxValue);
      const y = canvas.height - padding - (i / 5) * chartHeight;
      ctx.fillText(value, padding - 10, y + 4);
    }
  }, [data, height]);

  return (
    <div className="progress-chart">
      <h3 className="progress-chart__title">{title}</h3>
      <div className="progress-chart__container">
        <canvas ref={canvasRef} className="progress-chart__canvas" />
      </div>
    </div>
  );
};

export default ProgressChart;
