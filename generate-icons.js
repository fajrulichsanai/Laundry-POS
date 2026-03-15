const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Generate SVG icon for laundry
const generateIconSVG = (size) => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad1)" rx="${size/6}"/>
  <circle cx="${size/2}" cy="${size/2.2}" r="${size/4}" fill="none" stroke="#ffffff" stroke-width="${size/15}"/>
  <circle cx="${size/2.8}" cy="${size/3.5}" r="${size/25}" fill="#ffffff"/>
  <circle cx="${size/1.55}" cy="${size/3.5}" r="${size/25}" fill="#ffffff"/>
  <path d="M ${size/2.5} ${size/2.2} Q ${size/2} ${size/1.8}, ${size/1.65} ${size/2.2}" 
    fill="none" stroke="#ffffff" stroke-width="${size/20}" stroke-linecap="round"/>
  <rect x="${size/4}" y="${size/1.45}" width="${size/2}" height="${size/8}" fill="#ffffff" rx="${size/40}"/>
  <text x="${size/2}" y="${size/1.28}" font-family="Arial, sans-serif" font-size="${size/6.5}" 
    font-weight="bold" fill="#059669" text-anchor="middle">POS</text>
</svg>`;
  return Buffer.from(svg);
};

async function generateIcons() {
  try {
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    // Generate 192x192 icon
    const svg192 = generateIconSVG(192);
    await sharp(svg192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ Created: public/icon-192.png');

    // Generate 512x512 icon
    const svg512 = generateIconSVG(512);
    await sharp(svg512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✅ Created: public/icon-512.png');

    // Generate favicon
    const svgFavicon = generateIconSVG(64);
    await sharp(svgFavicon)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✅ Created: public/favicon.ico');

    // Generate apple-touch-icon
    const svgApple = generateIconSVG(180);
    await sharp(svgApple)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✅ Created: public/apple-touch-icon.png');

    console.log('');
    console.log('🎉 All PWA icons generated successfully!');
    console.log('📱 Your app is now ready to be installed on mobile devices.');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
  }
}

generateIcons();
