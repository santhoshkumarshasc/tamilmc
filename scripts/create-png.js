import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

function createPng(width, height, rgbaBuffer) {
  // CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    scanlines[rowStart] = 0; // filter None
    const srcRowStart = y * width * 4;
    rgbaBuffer.copy(scanlines, rowStart + 1, srcRowStart, srcRowStart + width * 4);
  }

  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Pixel map for TMC Minecraft Logo (Width: 32 blocks, Height: 18 blocks)
// Palette:
// . = Transparent (0, 0, 0, 0)
// Y = Bright Yellow Top Bevel (#FFEC40) -> [255, 236, 64, 255]
// y = Gold Top Face (#FFD220) -> [255, 210, 32, 255]
// O = Primary Orange (#F58700) -> [245, 135, 0, 255]
// o = Deep Orange (#DE6E00) -> [222, 110, 0, 255]
// s = Terracotta Shadow (#A34500) -> [163, 69, 0, 255]
// S = Dark Brown 3D Base (#5E2600) -> [94, 38, 0, 255]
// D = Deep Shadow (#361400) -> [54, 20, 0, 255]
// E = Eye Pupil (#18181B) -> [24, 24, 27, 255]
// N = Nose (#421C00) -> [66, 28, 0, 255]

const PALETTE = {
  '.': [0, 0, 0, 0],
  'Y': [255, 236, 64, 255],
  'y': [255, 210, 32, 255],
  'O': [245, 135, 0, 255],
  'o': [222, 110, 0, 255],
  's': [163, 69, 0, 255],
  'S': [94, 38, 0, 255],
  'D': [54, 20, 0, 255],
  'E': [24, 24, 27, 255],
  'N': [66, 28, 0, 255]
};

const PIXEL_ART = [
  "YYYYYYYY...YY........YY...YYYYYYYY",
  "yyyyyyyy...yy..YYYY..yy...yyyyyyyy",
  "yyOOOOyy...yyOOyyyyOOyy...yyOOOOyy",
  "..OOOO.......OOOOOOOO.......OOOO..",
  "..OOOO.......OOEEEEeO.......OOOO..",
  "..OOOO.......OONNNNwO.......OOOO..",
  "..OOOO.......OOooooOO.......OOOO..",
  "..oooo.......oooooooo.......oooo..",
  "..oooo.......oooooooo.......oooo..",
  "..ssss.......ssssssss.......ssss..",
  "..SSSS.......SSSSSSSS.......SSSS..",
  "..DDDD.......DDDDDDDD.......DDDD..",
  "..................................",
  "..OOOO.......OOOOOOOO.......OOOO..",
  "..ssss.......ssssssss.......ssss..",
  "..SSSS.......SSSSSSSS.......SSSS..",
  "..DDDD.......DDDDDDDD.......DDDD.."
];

// Let's create an accurate grid representation
// T: col 1..8, M: col 11..21, C: col 24..31
// Height: 15 rows
const ROWS = [
  "YYYYYYYY...YYYY....YYYY...YYYYYYYY",
  "yyyyyyyy...yyyyYYYYyyyy...yyyyyyyy",
  "yOOOOOOy...yOOOyyyyOOOy...yOOOOOOy",
  "..OOOO.......OOOOOOOO.......OOOO..",
  "..OOOO.......OOEE..EEO......OOOO..",
  "..OOOO.......OONN..NNO......OOOO..",
  "..OOOO.......OOOONNOOO......OOOO..",
  "..oooo.......oooooooo.......oooo..",
  "..ssss.......ssooooss.......ssss..",
  "..SSSS.......SSssssSS.......SSSS..",
  "..DDDD.......DDSSSSDD.......DDDD..",
  "..................................",
  "..................................",
  "..OOOO......................OOOO..",
  "..oooo......................oooo..",
  "..ssss......................ssss..",
  "..SSSS......................SSSS..",
  "..DDDD......................DDDD.."
];

// Better: Let's draw the 3 letters precisely on a 34 x 18 grid:
const GRID_ROWS = [
  // Row 0: Top bright yellow edge highlight
  "YYYYYYYY..YY.....YY..YYYYYYYY",
  // Row 1: Top gold beveled shelf
  "YYYYYYYY..YYYY.YYYY..YYYYYYYY",
  // Row 2: Front top bar & M upper arms
  "yOOOOOOy..yOOOOOOOy..yOOOOOOy",
  // Row 3: Stem / M columns / C spine
  "..OOOO....OO.yOy.OO..OOOO....",
  // Row 4: M eyes (E)
  "..OOOO....OO.E.E.OO..OOOO....",
  // Row 5: M wolf snout (N) & C lower shelf
  "..OOOO....OO.NNN.OO..OOOOyyyy",
  // Row 6: Lower stem / M legs / C bottom arm
  "..oooo....oooo.oooo..ooooOOOO",
  // Row 7: Deep shadow / 3D bottom bevel
  "..ssss....ssss.ssss..ssssssss",
  // Row 8: Dark base shadow
  "..SSSS....SSSS.SSSS..SSSSSSSS",
  // Row 9: Ambient shadow
  "..DDDD....DDDD.DDDD..DDDDDDDD"
];

// Let's build a dedicated drawer for crisp pixel rendering with scale factor
function renderGrid(scale, padX, padY, bgRgba = [0, 0, 0, 0]) {
  const gWidth = GRID_ROWS[0].length;
  const gHeight = GRID_ROWS.length;
  const totalW = gWidth * scale + padX * 2;
  const totalH = gHeight * scale + padY * 2;
  const buffer = Buffer.alloc(totalW * totalH * 4);

  // Fill background
  for (let i = 0; i < totalW * totalH; i++) {
    buffer[i * 4 + 0] = bgRgba[0];
    buffer[i * 4 + 1] = bgRgba[1];
    buffer[i * 4 + 2] = bgRgba[2];
    buffer[i * 4 + 3] = bgRgba[3];
  }

  for (let r = 0; r < gHeight; r++) {
    const rowStr = GRID_ROWS[r];
    for (let c = 0; c < gWidth; c++) {
      const char = rowStr[c] || '.';
      const col = PALETTE[char] || [0, 0, 0, 0];
      if (col[3] === 0) continue;

      const px0 = padX + c * scale;
      const py0 = padY + r * scale;

      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const idx = ((py0 + dy) * totalW + (px0 + dx)) * 4;
          buffer[idx + 0] = col[0];
          buffer[idx + 1] = col[1];
          buffer[idx + 2] = col[2];
          buffer[idx + 3] = col[3];
        }
      }
    }
  }

  return { width: totalW, height: totalH, buffer };
}

// Generate logo.svg
function generateSvg() {
  const gWidth = GRID_ROWS[0].length;
  const gHeight = GRID_ROWS.length;
  const scale = 20;
  const w = gWidth * scale;
  const h = gHeight * scale;
  let rects = '';

  for (let r = 0; r < gHeight; r++) {
    const rowStr = GRID_ROWS[r];
    for (let c = 0; c < gWidth; c++) {
      const char = rowStr[c] || '.';
      const col = PALETTE[char];
      if (!col || col[3] === 0) continue;
      const hex = '#' + ((1 << 24) + (col[0] << 16) + (col[1] << 8) + col[2]).toString(16).slice(1);
      rects += `<rect x="${c * scale}" y="${r * scale}" width="${scale}" height="${scale}" fill="${hex}"/>\n`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">\n${rects}</svg>`;
}

fs.writeFileSync(path.join(publicDir, 'logo.svg'), generateSvg());
console.log('Generated /public/logo.svg');

// Generate logo.png (512x512)
const logoData = renderGrid(16, 16, 176);
fs.writeFileSync(path.join(publicDir, 'logo.png'), createPng(logoData.width, logoData.height, logoData.buffer));
console.log(`Generated /public/logo.png (${logoData.width}x${logoData.height})`);

// Generate favicon.png (64x64)
const favData = renderGrid(2, 2, 22);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), createPng(favData.width, favData.height, favData.buffer));
console.log(`Generated /public/favicon.png (${favData.width}x${favData.height})`);

// Generate twt-logo.png for OpenGraph / Twitter Cards (1200x630 dark backdrop #0b140f)
const twtData = renderGrid(32, 120, 155, [11, 20, 15, 255]); // #0b140f
fs.writeFileSync(path.join(publicDir, 'twt-logo.png'), createPng(twtData.width, twtData.height, twtData.buffer));
console.log(`Generated /public/twt-logo.png (${twtData.width}x${twtData.height})`);
