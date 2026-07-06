// Generate new logo SVG and PNG icons for حراجك
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// New SVG logo - same dark style as old one, with Arabic text "حراجك"
const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <style type="text/css">
      .st0{fill:#2D2D2D;stroke:#FFFFFF;stroke-width:4;stroke-miterlimit:10;}
      .st1{fill:#FFFFFF;font-family:Tahoma,Geneva,Verdana,Arial,sans-serif;font-size:60;font-weight:900;}
    </style>
  </defs>
  <rect class="st0" x="16" y="16" width="160" height="160" rx="28" ry="28"/>
  <text class="st1" x="96" y="118" text-anchor="middle">حراجك</text>
</svg>`;

// Save SVG
fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent, 'utf8');
console.log('✓ logo.svg created');

// Generate PNG icons using sharp
async function generatePNGs() {
  try {
    // icon-192.png
    await sharp(Buffer.from(svgContent))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ icon-192.png created');

    // icon-512.png
    await sharp(Buffer.from(svgContent))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ icon-512.png created');

    // favicon.ico (32x32)
    await sharp(Buffer.from(svgContent))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));
    console.log('✓ favicon.png created (32x32)');

    console.log('\nAll icons generated successfully!');
  } catch (err) {
    console.error('Error generating PNGs:', err.message);
    console.error('SVG was created, but PNG generation failed.');
    console.error('You may need to manually convert the SVG to PNG.');
  }
}

generatePNGs();
