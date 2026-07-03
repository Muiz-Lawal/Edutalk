#!/usr/bin/env node

/**
 * Generate app icons for PWA
 * Creates 192x192 and 512x512 PNG icons in public/icons/
 */

const fs = require('fs');
const path = require('path');

// SVG icon template (EduTalk logo concept)
const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#grad1)" rx="48"/>
  
  <!-- Video camera icon (symbolizing teaching) -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Camera body -->
    <rect x="-45" y="-30" width="90" height="60" fill="none" stroke="white" stroke-width="6" rx="6"/>
    
    <!-- Camera lens -->
    <circle cx="-15" cy="0" r="20" fill="none" stroke="white" stroke-width="6"/>
    <circle cx="-15" cy="0" r="12" fill="white" opacity="0.3"/>
    
    <!-- Play button indicator -->
    <polygon points="25,0 35,-12 35,12" fill="white"/>
  </g>
</svg>
`;

// Maskable SVG icon (for Android adaptive icons)
const maskableSvgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Full background for maskable icon -->
  <circle cx="96" cy="96" r="96" fill="url(#grad2)"/>
  
  <!-- Video camera icon -->
  <g transform="translate(96, 96)">
    <!-- Camera body -->
    <rect x="-45" y="-30" width="90" height="60" fill="none" stroke="white" stroke-width="6" rx="6"/>
    
    <!-- Camera lens -->
    <circle cx="-15" cy="0" r="20" fill="none" stroke="white" stroke-width="6"/>
    <circle cx="-15" cy="0" r="12" fill="white" opacity="0.3"/>
    
    <!-- Play button indicator -->
    <polygon points="25,0 35,-12 35,12" fill="white"/>
  </g>
</svg>
`;

// Simple PNG generator using Canvas (built-in or fallback)
const generatePNG = (svgString, size, outputPath) => {
  try {
    // Try using canvas if available
    const Canvas = require('canvas');
    const canvas = Canvas.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // For now, just create a simple colored square with gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add rounded corners
    ctx.strokeStyle = 'transparent';
    ctx.lineWidth = 0;
    
    // Draw simple camera icon in the center
    ctx.fillStyle = 'white';
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Camera rectangle
    const camW = size * 0.4;
    const camH = size * 0.25;
    ctx.fillRect(centerX - camW/2, centerY - camH/2, camW, camH);
    
    // Camera lens
    ctx.beginPath();
    ctx.arc(centerX - camW/4, centerY, size * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(102, 126, 234, 0.5)';
    ctx.fill();
    
    // Write file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Generated ${path.basename(outputPath)}`);
    return true;
  } catch (err) {
    console.warn(`Canvas not available (${err.message}), creating placeholder...`);
    return false;
  }
};

// Fallback: Create minimal PNG using raw bytes
const createFallbackPNG = (size, outputPath) => {
  // Create a simple 1x1 purple PNG and scale in browser
  // PNG header + minimal image data
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk (image header)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  const ihdrData = Buffer.concat([Buffer.from('IHDR'), ihdr]);
  const ihdrCrc = calculateCrc('IHDR', ihdr);
  
  // Simple approach: Create SVG and save as SVG, then note to convert
  const svgPath = outputPath.replace('.png', '.svg');
  const svg = svgTemplate(size);
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Generated SVG: ${path.basename(svgPath)}`);
  
  // Also save as PNG comment placeholder (can be converted later)
  const placeholder = `<!-- Please convert this SVG to PNG: ${path.basename(svgPath)} -->`;
  fs.writeFileSync(outputPath, placeholder);
};

// CRC calculation helper
const calculateCrc = (type, data) => {
  // Simplified CRC - in production use a proper library
  return Buffer.alloc(4);
};

// Main execution
const run = () => {
  const iconsDir = path.join(__dirname, 'public', 'icons');
  
  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log(`✓ Created directory: ${iconsDir}`);
  }
  
  // Generate icons
  const sizes = [
    { size: 192, name: 'logo-192.png', maskable: 'logo-192-maskable.png' },
    { size: 512, name: 'logo-512.png', maskable: 'logo-512-maskable.png' },
  ];
  
  sizes.forEach(({ size, name, maskable }) => {
    const pngPath = path.join(iconsDir, name);
    const maskablePath = path.join(iconsDir, maskable);
    
    // Try Canvas first, fallback to SVG
    if (!generatePNG(svgTemplate(size), size, pngPath)) {
      createFallbackPNG(size, pngPath);
    }
    
    if (!generatePNG(maskableSvgTemplate(size), size, maskablePath)) {
      createFallbackPNG(size, maskablePath);
    }
  });
  
  // Also save SVG versions for reference
  const svgPath192 = path.join(iconsDir, 'logo-192.svg');
  const svgPath512 = path.join(iconsDir, 'logo-512.svg');
  
  fs.writeFileSync(svgPath192, svgTemplate(192));
  fs.writeFileSync(svgPath512, svgTemplate(512));
  console.log(`✓ Generated SVG icons`);
  
  console.log('\n✅ Icon generation complete!');
  console.log(`📁 Icons saved to: ${iconsDir}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Convert SVG files to PNG using: npx svg2png or online converter');
  console.log('   2. Update manifest.json with correct icon paths');
  console.log('   3. Verify icons in browser DevTools > Application > Manifest');
};

run();
