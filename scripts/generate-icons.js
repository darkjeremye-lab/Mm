import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure-JS PNG generator for luxury gold on obsidian icons
function generatePng(width, height, isMaskable = false) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded rect boundary or maskable square
      let insideShape = false;
      const cornerR = isMaskable ? 0 : width * 0.22;
      const qx = Math.max(0, Math.abs(dx) - (cx - cornerR));
      const qy = Math.max(0, Math.abs(dy) - (cy - cornerR));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);

      if (isMaskable) {
        insideShape = true;
      } else {
        insideShape = cornerDist <= cornerR;
      }

      if (!insideShape) {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0; // transparent
        continue;
      }

      // Background color: Luxury dark obsidian #1C1917 -> #12100E gradient
      const gradT = (y / height) * 0.8 + (x / width) * 0.2;
      let rCol = Math.round(32 - gradT * 12);
      let gCol = Math.round(28 - gradT * 12);
      let bCol = Math.round(24 - gradT * 10);

      // Gold border accent
      const borderThickness = width * 0.025;
      const isNearEdge = !isMaskable && cornerDist >= cornerR - borderThickness;

      // Draw stylized 'M' and 'W' geometry in center
      const nx = (x - cx) / (width * 0.35); // -1 to 1
      const ny = (y - cy) / (height * 0.35); // -1 to 1

      const inArch = ny >= -0.7 && ny <= -0.55 && Math.abs(nx) <= 0.85;
      const inBase = ny >= 0.55 && ny <= 0.7 && Math.abs(nx) <= 0.85;
      const inLeftCol = Math.abs(nx + 0.6) <= 0.08 && ny >= -0.55 && ny <= 0.55;
      const inRightCol = Math.abs(nx - 0.6) <= 0.08 && ny >= -0.55 && ny <= 0.55;
      const inCenterLeft = Math.abs(nx + 0.2) <= 0.07 && ny >= -0.55 && ny <= 0.55;
      const inCenterRight = Math.abs(nx - 0.2) <= 0.07 && ny >= -0.55 && ny <= 0.55;
      const inDiag1 = Math.abs((ny + 0.55) * 0.5 - (nx + 0.2)) <= 0.08 && ny >= -0.55 && ny <= 0.1;
      const inDiag2 = Math.abs((ny + 0.55) * 0.5 - (-nx + 0.2)) <= 0.08 && ny >= -0.55 && ny <= 0.1;

      const isGoldGlyph = inArch || inBase || inLeftCol || inRightCol || inCenterLeft || inCenterRight || inDiag1 || inDiag2;

      if (isGoldGlyph || isNearEdge) {
        // Gold gradient #F5D77F to #D4AF37 to #AA822A
        const goldT = (x + y) / (width + height);
        rCol = Math.round(220 + goldT * 25);
        gCol = Math.round(180 + goldT * 20);
        bCol = Math.round(75 + goldT * 30);
      }

      buffer[idx] = Math.min(255, Math.max(0, rCol));
      buffer[idx + 1] = Math.min(255, Math.max(0, gCol));
      buffer[idx + 2] = Math.min(255, Math.max(0, bCol));
      buffer[idx + 3] = 255;
    }
  }

  // Encode as PNG
  return createPngBuffer(width, height, buffer);
}

function createPngBuffer(width, height, rgbaBuffer) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk (scanlines with filter byte 0)
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    scanlines[rowOffset] = 0; // filter type 0: None
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });
  const idat = createChunk('IDAT', compressedData);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);

  // Calculate CRC32 for type + data
  const crcTarget = chunk.subarray(4, 8 + len);
  const crc = crc32(crcTarget);
  chunk.writeUInt32BE(crc >>> 0, 8 + len);
  return chunk;
}

// CRC32 table & helper
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// Generate all target files
const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
console.log('Successfully generated luxury PWA icons in /public/icons');
