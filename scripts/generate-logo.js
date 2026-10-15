// Generate high-resolution pixel art SVG and PNG representations of the TMC Minecraft logo
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

// Pixel grid definition (28 cols x 18 rows)
// Legend:
// '.' = Transparent
// 'Y' = Bright Yellow Top Face (#FFDF40)
// 'y' = Soft Gold Accent (#F6C325)
// 'O' = Rich Orange Front Face (#F58700)
// 'o' = Amber Darker Orange (#D96900)
// 'S' = Deep Terracotta Shadow (#8A3800)
// 'D' = Dark Base Shadow (#4A1B00)
// 'E' = Eye (#18181B)
// 'N' = Nose (#3F1D0B)
// 'w' = Wolf Snout Warm Brown (#6E3610)

const GRID = [
  "YYYYYYYY...YY........YY...YYYYYYYY",
  "YYYYYYYY...YY..YYYY..YY...YYYYYYYY",
  "yyOOOOyy...yyOOyyyyOOyy...yyOOOOyy",
  "..OOOO.......OOOOOOOO.......OOOO..",
  "..OOOO.......OOEEEEeO.......OOOO..",
  "..OOOO.......OONNNNwO.......OOOO..",
  "..OOOO.......OOwwwwOO.......OOOO..",
  "..oooo.......ooOwwOoo.......oooo..",
  "..oooo.......oooooooo.......oooo..",
  "..SSSS.......SSSSSSSS.......SSSS..",
  "..DDDD.......DDDDDDDD.......DDDD..",
  "..................................",
  "..OOOO......................OOOO..",
  "..oooo......................oooo..",
  "..SSSS......................SSSS..",
  "..DDDD......................DDDD..",
  "..................................",
  ".................................."
];

// Let's create an accurate vector SVG
const SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600" shape-rendering="crispEdges">
  <defs>
    <filter id="voxelGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="goldTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFEC66"/>
      <stop offset="100%" stop-color="#F5B300"/>
    </linearGradient>
    <linearGradient id="orangeFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF9500"/>
      <stop offset="60%" stop-color="#E86E00"/>
      <stop offset="100%" stop-color="#BD5200"/>
    </linearGradient>
    <linearGradient id="shadowBottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6E2B00"/>
      <stop offset="100%" stop-color="#3B1400"/>
    </linearGradient>
  </defs>

  <!-- TMC 3D Pixel Voxel Typography -->
  <g filter="url(#voxelGlow)">
    <!-- ==================== LETTER 'T' ==================== -->
    <!-- T 3D Under-Shadow -->
    <path d="M 60,180 L 320,180 L 320,195 L 220,195 L 220,490 L 160,490 L 160,195 L 60,195 Z" fill="#3B1400"/>
    <!-- T 3D Depth Extrusion Bottom -->
    <rect x="60" y="165" width="260" height="20" fill="#6E2B00"/>
    <rect x="160" y="465" width="60" height="22" fill="#521F00"/>
    <rect x="160" y="482" width="60" height="12" fill="#331000"/>

    <!-- T Front Face -->
    <!-- Top bar -->
    <rect x="60" y="100" width="260" height="75" fill="url(#orangeFront)"/>
    <!-- Stem -->
    <rect x="160" y="175" width="60" height="295" fill="url(#orangeFront)"/>
    <!-- T Pixel shading accents -->
    <rect x="60" y="100" width="40" height="35" fill="#FFAF1A"/>
    <rect x="280" y="100" width="40" height="35" fill="#FFAF1A"/>
    <rect x="160" y="175" width="20" height="290" fill="#E86E00"/>
    <rect x="160" y="420" width="60" height="50" fill="#B54A00"/>
    <rect x="60" y="150" width="100" height="25" fill="#C25400"/>
    <rect x="220" y="150" width="100" height="25" fill="#C25400"/>

    <!-- T Top Golden Face -->
    <rect x="60" y="80" width="260" height="20" fill="url(#goldTop)"/>
    <rect x="60" y="80" width="260" height="6" fill="#FFF499"/>

    <!-- ==================== LETTER 'M' ==================== -->
    <!-- M 3D Under-Shadow -->
    <path d="M 360,180 L 460,335 L 470,335 L 470,380 L 530,380 L 530,335 L 540,335 L 640,180 L 640,490 L 540,490 L 540,400 L 460,400 L 460,490 L 360,490 Z" fill="#3B1400"/>
    <!-- M Bottom Shadow Drops -->
    <rect x="360" y="465" width="80" height="22" fill="#521F00"/>
    <rect x="360" y="482" width="80" height="12" fill="#331000"/>
    <rect x="560" y="465" width="80" height="22" fill="#521F00"/>
    <rect x="560" y="482" width="80" height="12" fill="#331000"/>
    <rect x="460" y="380" width="80" height="18" fill="#521F00"/>
    <rect x="480" y="395" width="40" height="12" fill="#331000"/>

    <!-- M Front Face -->
    <!-- Left column -->
    <rect x="360" y="100" width="80" height="370" fill="url(#orangeFront)"/>
    <!-- Right column -->
    <rect x="560" y="100" width="80" height="370" fill="url(#orangeFront)"/>
    <!-- Center slope left -->
    <polygon points="440,100 500,240 440,320" fill="url(#orangeFront)"/>
    <!-- Center slope right -->
    <polygon points="560,100 500,240 560,320" fill="url(#orangeFront)"/>
    <!-- Center block fill -->
    <rect x="440" y="240" width="120" height="145" fill="url(#orangeFront)"/>

    <!-- M Wolf / Dog Face in Center Notch -->
    <!-- Wolf Eyes -->
    <rect x="460" y="300" width="22" height="22" fill="#18181B"/>
    <rect x="518" y="300" width="22" height="22" fill="#18181B"/>
    <!-- Eye highlights -->
    <rect x="460" y="300" width="8" height="8" fill="#FFFFFF"/>
    <rect x="518" y="300" width="8" height="8" fill="#FFFFFF"/>
    <!-- Wolf Snout (brown/dark pixel) -->
    <rect x="485" y="335" width="30" height="22" fill="#3B1400"/>
    <rect x="490" y="357" width="20" height="14" fill="#572200"/>

    <!-- M Shading & highlights -->
    <rect x="360" y="100" width="30" height="60" fill="#FFAF1A"/>
    <rect x="610" y="100" width="30" height="60" fill="#FFAF1A"/>
    <rect x="360" y="420" width="80" height="50" fill="#B54A00"/>
    <rect x="560" y="420" width="80" height="50" fill="#B54A00"/>

    <!-- M Top Golden Face -->
    <rect x="360" y="80" width="80" height="20" fill="url(#goldTop)"/>
    <rect x="360" y="80" width="80" height="6" fill="#FFF499"/>
    <rect x="560" y="80" width="80" height="20" fill="url(#goldTop)"/>
    <rect x="560" y="80" width="80" height="6" fill="#FFF499"/>
    <polygon points="440,80 500,160 560,80 540,80 500,135 460,80" fill="url(#goldTop)"/>

    <!-- ==================== LETTER 'C' ==================== -->
    <!-- C 3D Under-Shadow -->
    <path d="M 680,180 L 940,180 L 940,195 L 760,195 L 760,390 L 940,390 L 940,490 L 680,490 Z" fill="#3B1400"/>
    <rect x="680" y="465" width="260" height="22" fill="#521F00"/>
    <rect x="680" y="482" width="260" height="12" fill="#331000"/>
    <rect x="860" y="165" width="80" height="20" fill="#6E2B00"/>

    <!-- C Front Face -->
    <!-- Left spine -->
    <rect x="680" y="100" width="80" height="370" fill="url(#orangeFront)"/>
    <!-- Top bar -->
    <rect x="760" y="100" width="180" height="75" fill="url(#orangeFront)"/>
    <!-- Bottom bar -->
    <rect x="760" y="395" width="180" height="75" fill="url(#orangeFront)"/>

    <!-- C Shading & highlights -->
    <rect x="680" y="100" width="30" height="60" fill="#FFAF1A"/>
    <rect x="900" y="100" width="40" height="35" fill="#FFAF1A"/>
    <rect x="900" y="395" width="40" height="35" fill="#FFAF1A"/>
    <rect x="760" y="150" width="180" height="25" fill="#C25400"/>
    <rect x="680" y="420" width="260" height="50" fill="#B54A00"/>

    <!-- C Top Golden Face -->
    <rect x="680" y="80" width="260" height="20" fill="url(#goldTop)"/>
    <rect x="680" y="80" width="260" height="6" fill="#FFF499"/>
    <!-- C Inner shelf Golden Face -->
    <rect x="760" y="380" width="180" height="15" fill="url(#goldTop)"/>
    <rect x="760" y="380" width="180" height="5" fill="#FFF499"/>
  </g>
</svg>`;

// Write logo.svg
fs.writeFileSync(path.join(publicDir, 'logo.svg'), SVG_CONTENT.trim());
console.log('Created /public/logo.svg successfully.');
