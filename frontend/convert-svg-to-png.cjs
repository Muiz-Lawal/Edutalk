#!/usr/bin/env node

/**
 * Convert SVG icons to PNG using sharp
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const iconsDir = path.join(__dirname, 'public', 'icons');

const convertSVGtoPNG = async () => {
  try {
    // Define conversions
    const conversions = [
      { svg: 'logo-192.svg', png: 'logo-192.png', size: 192 },
      { svg: 'logo-512.svg', png: 'logo-512.png', size: 512 },
      { svg: 'logo-192-maskable.svg', png: 'logo-192-maskable.png', size: 192 },
      { svg: 'logo-512-maskable.svg', png: 'logo-512-maskable.png', size: 512 },
    ];

    for (const { svg, png, size } of conversions) {
      const svgPath = path.join(iconsDir, svg);
      const pngPath = path.join(iconsDir, png);

      if (!fs.existsSync(svgPath)) {
        console.warn(`⚠️  SVG not found: ${svg}`);
        continue;
      }

      await sharp(svgPath)
        .png({ quality: 90 })
        .resize(size, size, { fit: 'cover' })
        .toFile(pngPath);

      console.log(`✓ Converted: ${svg} → ${png}`);
    }

    console.log('\n✅ PNG conversion complete!');
  } catch (err) {
    console.error('❌ Conversion error:', err.message);
    process.exit(1);
  }
};

convertSVGtoPNG();
