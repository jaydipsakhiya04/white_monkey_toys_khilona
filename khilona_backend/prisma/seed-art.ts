/**
 * Flat vector illustrations used for development seed data.
 * Each function returns SVG markup drawn on an 800×800 canvas.
 */

const INK = '#2A2838';
const WHITE = '#FFFFFF';
const shadow = (cx = 400, cy = 640, rx = 250) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="20" fill="#1D1B2F" opacity="0.08"/>`;

export type ArtKind =
  | 'car' | 'truck' | 'train' | 'teddy' | 'doll' | 'elephant' | 'blocks' | 'tiles' | 'flask' | 'puzzle'
  | 'robot' | 'abacus' | 'board' | 'chess' | 'cube' | 'cricket' | 'kite' | 'bubbles' | 'xylophone'
  | 'rings' | 'crayons' | 'clay' | 'map' | 'stars';

const art: Record<ArtKind, (c: string) => string> = {
  car: (c) => `${shadow(410, 610, 270)}
    <path d="M160 470 Q160 420 212 410 L300 398 L362 318 Q378 298 404 298 L524 298 Q550 298 566 320 L614 398 L626 400 Q662 410 662 452 L662 522 Q662 548 636 548 L186 548 Q160 548 160 522 Z" fill="${c}"/>
    <path d="M384 330 L334 398 L452 398 L452 330 Z" fill="#CFE8FF"/>
    <path d="M478 330 L478 398 L584 398 L540 330 Z" fill="#CFE8FF"/>
    <rect x="190" y="468" width="440" height="14" rx="7" fill="${WHITE}" opacity="0.35"/>
    <rect x="636" y="436" width="24" height="28" rx="7" fill="#FFC53D"/>
    <rect x="160" y="440" width="18" height="26" rx="6" fill="#E4572E" opacity="0.8"/>
    <circle cx="270" cy="550" r="62" fill="${INK}"/><circle cx="270" cy="550" r="26" fill="#C9CDD6"/>
    <circle cx="556" cy="550" r="62" fill="${INK}"/><circle cx="556" cy="550" r="26" fill="#C9CDD6"/>`,
  truck: (c) => `${shadow(400, 640, 280)}
    <path d="M190 380 L330 380 L380 300 L520 300 Q545 300 556 322 L590 380 L620 382 Q650 390 650 425 L650 470 L190 470 Z" fill="${c}"/>
    <path d="M396 322 L360 380 L460 380 L460 322 Z" fill="#CFE8FF"/><path d="M482 322 L482 380 L568 380 L540 322 Z" fill="#CFE8FF"/>
    <rect x="230" y="462" width="380" height="36" rx="10" fill="${INK}" opacity="0.85"/>
    <circle cx="270" cy="560" r="86" fill="${INK}"/><circle cx="270" cy="560" r="38" fill="#FFC53D"/>
    <circle cx="550" cy="560" r="86" fill="${INK}"/><circle cx="550" cy="560" r="38" fill="#FFC53D"/>
    <g fill="${INK}" opacity="0.6"><rect x="190" y="540" width="20" height="40" rx="4"/><rect x="610" y="540" width="20" height="40" rx="4"/></g>`,
  train: (c) => `${shadow(400, 610, 300)}
    <rect x="110" y="380" width="240" height="160" rx="22" fill="#0F8B8D"/>
    <rect x="140" y="410" width="80" height="60" rx="10" fill="#CFE8FF"/><rect x="240" y="410" width="80" height="60" rx="10" fill="#CFE8FF"/>
    <rect x="370" y="300" width="300" height="240" rx="26" fill="${c}"/>
    <rect x="400" y="330" width="120" height="90" rx="14" fill="#CFE8FF"/>
    <rect x="560" y="230" width="60" height="90" rx="10" fill="${INK}"/><rect x="548" y="214" width="84" height="26" rx="10" fill="${INK}"/>
    <rect x="660" y="470" width="50" height="60" rx="8" fill="#FFC53D"/>
    <rect x="340" y="500" width="40" height="16" rx="6" fill="${INK}"/>
    <g fill="${INK}"><circle cx="170" cy="560" r="40"/><circle cx="290" cy="560" r="40"/><circle cx="440" cy="560" r="46"/><circle cx="600" cy="560" r="46"/></g>
    <g fill="#C9CDD6"><circle cx="170" cy="560" r="14"/><circle cx="290" cy="560" r="14"/><circle cx="440" cy="560" r="16"/><circle cx="600" cy="560" r="16"/></g>`,
  teddy: (c) => `${shadow(400, 660, 220)}
    <circle cx="290" cy="190" r="60" fill="${c}"/><circle cx="510" cy="190" r="60" fill="${c}"/>
    <circle cx="290" cy="190" r="32" fill="#F6D9B8"/><circle cx="510" cy="190" r="32" fill="#F6D9B8"/>
    <ellipse cx="400" cy="500" rx="170" ry="160" fill="${c}"/>
    <ellipse cx="400" cy="520" rx="100" ry="100" fill="#F6D9B8"/>
    <ellipse cx="245" cy="470" rx="55" ry="90" transform="rotate(25 245 470)" fill="${c}"/>
    <ellipse cx="555" cy="470" rx="55" ry="90" transform="rotate(-25 555 470)" fill="${c}"/>
    <ellipse cx="300" cy="630" rx="70" ry="50" fill="${c}"/><ellipse cx="500" cy="630" rx="70" ry="50" fill="${c}"/>
    <circle cx="400" cy="270" r="140" fill="${c}"/>
    <ellipse cx="400" cy="315" rx="62" ry="48" fill="#F6D9B8"/>
    <ellipse cx="400" cy="296" rx="22" ry="16" fill="${INK}"/>
    <circle cx="350" cy="240" r="13" fill="${INK}"/><circle cx="450" cy="240" r="13" fill="${INK}"/>
    <path d="M380 330 Q400 346 420 330" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M340 400 L400 430 L460 400 L460 440 L400 420 L340 440 Z" fill="#E4572E"/>`,
  doll: (c) => `${shadow(400, 670, 180)}
    <path d="M400 360 L250 640 L550 640 Z" fill="${c}"/>
    <rect x="250" y="620" width="300" height="24" rx="12" fill="${WHITE}" opacity="0.5"/>
    <rect x="340" y="640" width="30" height="40" rx="10" fill="#F2C9A5"/><rect x="430" y="640" width="30" height="40" rx="10" fill="#F2C9A5"/>
    <rect x="300" y="400" width="26" height="150" rx="13" transform="rotate(20 313 400)" fill="#F2C9A5"/>
    <rect x="474" y="400" width="26" height="150" rx="13" transform="rotate(-20 487 400)" fill="#F2C9A5"/>
    <path d="M270 260 Q260 120 400 110 Q540 120 530 260 L540 420 Q470 380 400 380 Q330 380 260 420 Z" fill="#5B3A29"/>
    <circle cx="400" cy="260" r="110" fill="#F2C9A5"/>
    <path d="M290 230 Q320 140 400 140 Q480 140 510 230 Q440 190 400 200 Q350 190 290 230 Z" fill="#5B3A29"/>
    <circle cx="360" cy="270" r="12" fill="${INK}"/><circle cx="440" cy="270" r="12" fill="${INK}"/>
    <circle cx="340" cy="305" r="16" fill="#F5A3A3" opacity="0.7"/><circle cx="460" cy="305" r="16" fill="#F5A3A3" opacity="0.7"/>
    <path d="M380 315 Q400 332 420 315" stroke="#C0392B" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="500" cy="170" r="26" fill="${c}"/>`,
  elephant: (c) => `${shadow(400, 640, 240)}
    <ellipse cx="430" cy="470" rx="210" ry="150" fill="${c}"/>
    <rect x="290" y="520" width="70" height="110" rx="30" fill="${c}"/><rect x="390" y="530" width="70" height="100" rx="30" fill="${c}"/>
    <rect x="480" y="530" width="70" height="100" rx="30" fill="${c}"/><rect x="560" y="510" width="66" height="116" rx="30" fill="${c}"/>
    <circle cx="270" cy="360" r="130" fill="${c}"/>
    <ellipse cx="330" cy="360" rx="80" ry="105" fill="#F7B6C8"/>
    <path d="M170 380 Q120 470 150 560 Q160 590 190 580 Q205 570 195 545 Q175 480 230 420 Z" fill="${c}"/>
    <circle cx="230" cy="330" r="14" fill="${INK}"/>
    <path d="M640 440 Q690 470 670 520" stroke="${c}" stroke-width="14" fill="none" stroke-linecap="round"/>`,
  blocks: (c) => `${shadow(400, 650, 280)}
    ${brick(150, 480, 260, 150, '#E4572E')}${brick(410, 480, 240, 150, '#0F8B8D')}
    ${brick(250, 330, 300, 150, c)}${brick(330, 180, 160, 150, '#FFC53D')}`,
  tiles: (c) => `${shadow(400, 650, 280)}
    <g opacity="0.92">
      <rect x="150" y="380" width="180" height="180" rx="14" fill="#E4572E"/><rect x="330" y="380" width="180" height="180" rx="14" fill="#FFC53D"/>
      <rect x="510" y="380" width="160" height="180" rx="14" fill="#0F8B8D"/>
      <path d="M240 380 L330 220 L420 380 Z" fill="${c}"/><path d="M420 380 L510 220 L600 380 Z" fill="#7B6CF6"/>
      <path d="M330 220 L510 220 L420 380 Z" fill="#33B679"/>
    </g>
    <g fill="${WHITE}" opacity="0.45"><rect x="170" y="400" width="140" height="140" rx="10"/><rect x="350" y="400" width="140" height="140" rx="10"/><rect x="530" y="400" width="120" height="140" rx="10"/></g>`,
  flask: (c) => `${shadow(400, 660, 220)}
    <rect x="345" y="140" width="110" height="40" rx="12" fill="#C9CDD6"/>
    <path d="M360 180 L440 180 L440 330 L590 600 Q610 650 560 650 L240 650 Q190 650 210 600 L360 330 Z" fill="#E9F4FF"/>
    <path d="M285 470 L515 470 L590 600 Q610 650 560 650 L240 650 Q190 650 210 600 Z" fill="${c}"/>
    <g fill="${WHITE}" opacity="0.7"><circle cx="330" cy="560" r="16"/><circle cx="430" cy="520" r="11"/><circle cx="480" cy="590" r="20"/><circle cx="400" cy="420" r="12"/><circle cx="420" cy="360" r="8"/></g>
    <path d="M600 520 L640 470 L680 520 L640 600 Z" fill="#7B6CF6"/><path d="M640 470 L640 600 L680 520 Z" fill="#5A4BE0"/>
    <path d="M130 560 L160 520 L190 560 L160 620 Z" fill="#33B679"/>`,
  puzzle: (c) => `${shadow(400, 650, 260)}
    ${piece(180, 200, '#E4572E')}${piece(400, 200, c)}${piece(180, 420, '#0F8B8D')}${piece(420, 440, '#FFC53D', 12)}`,
  robot: (c) => `${shadow(400, 670, 220)}
    <rect x="388" y="110" width="24" height="70" rx="12" fill="${INK}"/><circle cx="400" cy="104" r="22" fill="#E4572E"/>
    <rect x="260" y="170" width="280" height="210" rx="40" fill="${c}"/>
    <rect x="300" y="215" width="200" height="110" rx="26" fill="${INK}"/>
    <circle cx="355" cy="270" r="24" fill="#5EF2D6"/><circle cx="445" cy="270" r="24" fill="#5EF2D6"/>
    <rect x="290" y="400" width="220" height="200" rx="34" fill="${c}"/>
    <rect x="330" y="430" width="140" height="70" rx="10" fill="#1E3A8A"/>
    <g stroke="#93C5FD" stroke-width="4"><line x1="377" y1="430" x2="377" y2="500"/><line x1="423" y1="430" x2="423" y2="500"/><line x1="330" y1="465" x2="470" y2="465"/></g>
    <rect x="205" y="420" width="70" height="150" rx="34" fill="${INK}" opacity="0.85"/><rect x="525" y="420" width="70" height="150" rx="34" fill="${INK}" opacity="0.85"/>
    <rect x="320" y="600" width="60" height="60" rx="16" fill="${INK}"/><rect x="420" y="600" width="60" height="60" rx="16" fill="${INK}"/>`,
  abacus: (c) => `${shadow(400, 670, 250)}
    <rect x="170" y="150" width="40" height="510" rx="16" fill="#8B5E3C"/><rect x="590" y="150" width="40" height="510" rx="16" fill="#8B5E3C"/>
    <rect x="160" y="140" width="480" height="40" rx="16" fill="#A0703F"/><rect x="160" y="610" width="480" height="40" rx="16" fill="#A0703F"/>
    ${[0, 1, 2, 3, 4].map((r) => {
      const y = 240 + r * 82;
      const colors = ['#E4572E', '#FFC53D', c, '#0F8B8D', '#7B6CF6'];
      return `<rect x="210" y="${y - 3}" width="380" height="6" fill="#C9CDD6"/>` +
        [0, 1, 2, 3, 4].map((b) => `<ellipse cx="${250 + b * 48 + (b > 2 ? 90 : 0)}" cy="${y}" rx="24" ry="28" fill="${colors[r]}"/>`).join('');
    }).join('')}`,
  board: (c) => `${shadow(400, 640, 280)}
    <rect x="140" y="160" width="520" height="440" rx="28" fill="${c}"/>
    <rect x="175" y="195" width="450" height="370" rx="14" fill="${WHITE}"/>
    ${grid(175, 195, 450, 370, 6, 5)}
    <path d="M230 520 Q330 380 300 260" stroke="#E4572E" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M520 260 L460 520" stroke="#33B679" stroke-width="12" fill="none"/><path d="M560 260 L500 520" stroke="#33B679" stroke-width="12" fill="none"/>
    ${[0, 1, 2, 3].map((i) => `<line x1="${515 - i * 15 + 40}" y1="${300 + i * 60}" x2="${515 - i * 15}" y2="${300 + i * 60}" stroke="#33B679" stroke-width="10"/>`).join('')}
    <g transform="translate(560 560) rotate(12)"><rect x="-55" y="-55" width="110" height="110" rx="20" fill="${WHITE}" stroke="${INK}" stroke-width="6"/>
    <circle cx="-25" cy="-25" r="10" fill="${INK}"/><circle cx="0" cy="0" r="10" fill="${INK}"/><circle cx="25" cy="25" r="10" fill="${INK}"/></g>`,
  chess: (c) => `${shadow(400, 640, 280)}
    <rect x="140" y="250" width="520" height="360" rx="20" fill="#8B5E3C"/>
    ${checker(165, 275, 470, 310, 8, 6, c)}
    <g fill="${INK}"><circle cx="300" cy="180" r="34"/><path d="M262 230 L338 230 L360 330 L240 330 Z"/><rect x="225" y="320" width="150" height="30" rx="10"/></g>
    <g fill="${WHITE}" stroke="${INK}" stroke-width="5"><rect x="485" y="110" width="30" height="70" rx="6"/><rect x="465" y="130" width="70" height="26" rx="6"/>
    <path d="M460 190 L540 190 L560 330 L440 330 Z"/><rect x="425" y="320" width="150" height="30" rx="10"/></g>`,
  cube: () => {
    const top = ['#FFFFFF', '#FFC53D', '#FFFFFF', '#E4572E', '#FFFFFF', '#33B679', '#FFFFFF', '#0F8B8D', '#FFFFFF'];
    const left = ['#E4572E', '#E4572E', '#33B679', '#E4572E', '#FFC53D', '#E4572E', '#7B6CF6', '#E4572E', '#E4572E'];
    const right = ['#0F8B8D', '#0F8B8D', '#FFC53D', '#33B679', '#0F8B8D', '#0F8B8D', '#0F8B8D', '#E4572E', '#0F8B8D'];
    return `${shadow(400, 670, 230)}${isoFace('top', top)}${isoFace('left', left)}${isoFace('right', right)}`;
  },
  cricket: (c) => `${shadow(400, 670, 270)}
    <g transform="rotate(-28 400 400)"><rect x="370" y="120" width="60" height="150" rx="20" fill="${INK}"/>
    <rect x="345" y="260" width="110" height="380" rx="40" fill="${c}"/><rect x="380" y="290" width="20" height="320" rx="10" fill="${WHITE}" opacity="0.35"/></g>
    <g fill="#F3E3C3"><rect x="560" y="380" width="22" height="280" rx="8"/><rect x="605" y="380" width="22" height="280" rx="8"/><rect x="650" y="380" width="22" height="280" rx="8"/></g>
    <rect x="552" y="368" width="128" height="16" rx="8" fill="#C9A86A"/>
    <circle cx="210" cy="590" r="56" fill="#C0392B"/><path d="M170 550 Q210 590 250 630" stroke="${WHITE}" stroke-width="6" fill="none" stroke-dasharray="10 8"/>`,
  kite: (c) => `
    <path d="M400 100 L590 330 L400 560 L210 330 Z" fill="${c}"/>
    <path d="M400 100 L590 330 L400 330 Z" fill="${WHITE}" opacity="0.3"/><path d="M400 330 L400 560 L210 330 Z" fill="${INK}" opacity="0.12"/>
    <line x1="400" y1="100" x2="400" y2="560" stroke="${INK}" stroke-width="6"/><line x1="210" y1="330" x2="590" y2="330" stroke="${INK}" stroke-width="6"/>
    <path d="M400 560 Q360 620 420 660 Q480 700 430 760" stroke="${INK}" stroke-width="5" fill="none"/>
    <path d="M375 610 L405 625 L375 640 Z" fill="#FFC53D"/><path d="M425 680 L455 695 L425 710 Z" fill="#0F8B8D"/>`,
  bubbles: (c) => `${shadow(330, 660, 200)}
    <path d="M180 420 L460 420 Q500 420 500 460 L500 500 L300 500 L270 640 Q264 660 244 660 L200 660 Q180 660 186 640 L220 500 L180 500 Q150 500 150 460 Q150 420 180 420 Z" fill="${c}"/>
    <rect x="500" y="440" width="70" height="44" rx="12" fill="${INK}" opacity="0.8"/>
    <g fill="none" stroke="#7B6CF6" stroke-width="6" opacity="0.75"><circle cx="620" cy="320" r="70"/><circle cx="520" cy="200" r="46"/><circle cx="680" cy="170" r="34"/><circle cx="420" cy="280" r="30"/></g>
    <g fill="${WHITE}" opacity="0.8"><circle cx="595" cy="295" r="12"/><circle cx="505" cy="185" r="8"/></g>`,
  xylophone: () => `${shadow(400, 640, 290)}
    <path d="M140 300 L660 380 L660 470 L140 540 Z" fill="#8B5E3C" opacity="0.3"/>
    ${['#E4572E', '#FF8A3D', '#FFC53D', '#33B679', '#0F8B8D', '#3B82F6', '#7B6CF6'].map((col, i) => {
      const x = 170 + i * 68;
      const h = 300 - i * 22;
      return `<rect x="${x}" y="${420 - h / 2}" width="54" height="${h}" rx="12" fill="${col}"/><circle cx="${x + 27}" cy="${420 - h / 2 + 22}" r="6" fill="${WHITE}" opacity="0.7"/><circle cx="${x + 27}" cy="${420 + h / 2 - 22}" r="6" fill="${WHITE}" opacity="0.7"/>`;
    }).join('')}
    <g transform="rotate(-35 560 620)"><rect x="470" y="610" width="200" height="14" rx="7" fill="#C9A86A"/><circle cx="680" cy="617" r="24" fill="${INK}"/></g>`,
  rings: () => `${shadow(400, 660, 220)}
    <rect x="388" y="150" width="24" height="460" rx="12" fill="#C9A86A"/><circle cx="400" cy="150" r="30" fill="#FFC53D"/>
    ${['#E4572E', '#FF8A3D', '#FFC53D', '#33B679', '#0F8B8D'].map((col, i) => {
      const rx = 200 - i * 30;
      return `<ellipse cx="400" cy="${600 - i * 76}" rx="${rx}" ry="44" fill="${col}"/><ellipse cx="400" cy="${590 - i * 76}" rx="${rx - 20}" ry="22" fill="${WHITE}" opacity="0.2"/>`;
    }).join('')}`,
  crayons: () =>
    `${shadow(400, 660, 260)}` +
    ['#E4572E', '#FFC53D', '#33B679', '#0F8B8D', '#7B6CF6', '#EC4899'].map((col, i) => {
      const angle = -25 + i * 10;
      return `<g transform="rotate(${angle} 400 640)"><rect x="378" y="250" width="44" height="380" rx="8" fill="${col}"/><path d="M378 250 L400 180 L422 250 Z" fill="${col}"/><rect x="378" y="300" width="44" height="18" fill="${INK}" opacity="0.25"/><rect x="378" y="560" width="44" height="18" fill="${INK}" opacity="0.25"/></g>`;
    }).join(''),
  clay: (c) => `${shadow(400, 640, 280)}
    ${tub(150, 380, '#E4572E')}${tub(330, 340, c)}${tub(510, 380, '#33B679')}
    <path d="M250 300 Q300 230 360 280 Q420 330 470 270" stroke="#FFC53D" stroke-width="34" fill="none" stroke-linecap="round"/>`,
  map: (c) => `${shadow(400, 650, 280)}
    <rect x="130" y="180" width="540" height="420" rx="20" fill="#7CC4F2"/>
    <path d="M190 260 Q260 220 300 270 Q330 320 280 360 Q230 380 200 330 Z" fill="${c}"/>
    <path d="M300 400 Q340 380 360 430 Q360 520 320 560 Q290 520 290 470 Z" fill="${c}"/>
    <path d="M400 250 Q470 220 520 260 Q600 250 620 300 Q600 360 540 360 Q500 400 450 360 Q400 330 400 250 Z" fill="${c}"/>
    <path d="M450 400 Q500 390 500 460 Q480 520 450 500 Q430 450 450 400 Z" fill="${c}"/>
    <path d="M560 470 Q610 460 620 500 Q600 540 560 520 Z" fill="${c}"/>
    <g stroke="${WHITE}" stroke-width="5" fill="none" opacity="0.8"><path d="M130 390 Q200 370 250 390 Q300 410 400 390 Q500 370 670 390"/><path d="M400 180 Q380 300 400 390 Q420 500 400 600"/></g>`,
  stars: (c) => `
    ${star(260, 280, 110, c)}${star(520, 220, 70, '#FFC53D')}${star(540, 470, 130, c)}${star(250, 560, 60, '#FFC53D')}
    <circle cx="640" cy="150" r="14" fill="${c}"/><circle cx="160" cy="420" r="10" fill="${c}"/>`,
};

function brick(x: number, y: number, w: number, h: number, color: string) {
  const studs = Math.max(2, Math.round(w / 80));
  const gap = w / studs;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${color}"/>
    <rect x="${x}" y="${y + h - 26}" width="${w}" height="26" rx="10" fill="#1D1B2F" opacity="0.12"/>
    ${Array.from({ length: studs }, (_, i) => `<rect x="${x + gap * i + gap / 2 - 30}" y="${y - 30}" width="60" height="36" rx="10" fill="${color}"/><rect x="${x + gap * i + gap / 2 - 30}" y="${y - 30}" width="60" height="12" rx="6" fill="#FFFFFF" opacity="0.3"/>`).join('')}`;
}

function piece(x: number, y: number, color: string, rotate = 0) {
  return `<g transform="rotate(${rotate} ${x + 100} ${y + 100})"><rect x="${x}" y="${y}" width="200" height="200" rx="18" fill="${color}"/>
    <circle cx="${x + 200}" cy="${y + 100}" r="38" fill="${color}"/><circle cx="${x + 100}" cy="${y + 200}" r="38" fill="${color}"/>
    <rect x="${x + 16}" y="${y + 16}" width="70" height="20" rx="10" fill="#FFFFFF" opacity="0.3"/></g>`;
}

function grid(x: number, y: number, w: number, h: number, cols: number, rows: number) {
  const palette = ['#FDEEE8', '#FFF1C9', '#DDF2EE', '#E6E9FF'];
  let out = '';
  for (let r = 0; r < rows; r++)
    for (let col = 0; col < cols; col++)
      out += `<rect x="${x + (col * w) / cols}" y="${y + (r * h) / rows}" width="${w / cols}" height="${h / rows}" fill="${palette[(r + col) % 4]}" stroke="#ECE5DA" stroke-width="2"/>`;
  return out;
}

function checker(x: number, y: number, w: number, h: number, cols: number, rows: number, dark: string) {
  let out = '';
  for (let r = 0; r < rows; r++)
    for (let col = 0; col < cols; col++)
      out += `<rect x="${x + (col * w) / cols}" y="${y + (r * h) / rows}" width="${w / cols}" height="${h / rows}" fill="${(r + col) % 2 ? dark : '#F6F1E9'}"/>`;
  return out;
}

function isoFace(face: 'top' | 'left' | 'right', colors: string[]) {
  // Cube centred at (400, 420) with edge length 300 in isometric projection.
  const s = 300 / 3;
  const cx = 400;
  const cy = 420;
  const dx = Math.cos(Math.PI / 6) * s;
  const dy = Math.sin(Math.PI / 6) * s;
  let out = '';
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let p: [number, number][];
      if (face === 'top') {
        const ox = cx + (i - j) * dx;
        const oy = cy - 3 * s + (i + j) * dy;
        p = [[ox, oy], [ox + dx, oy + dy], [ox, oy + 2 * dy], [ox - dx, oy + dy]];
      } else if (face === 'left') {
        const ox = cx - 3 * dx + i * dx;
        const oy = cy - 3 * dy + i * dy + j * s;
        p = [[ox, oy], [ox + dx, oy + dy], [ox + dx, oy + dy + s], [ox, oy + s]];
      } else {
        const ox = cx + i * dx;
        const oy = cy - i * dy + j * s;
        p = [[ox, oy], [ox + dx, oy - dy], [ox + dx, oy - dy + s], [ox, oy + s]];
      }
      out += `<polygon points="${p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')}" fill="${colors[i * 3 + j]}" stroke="#1D1B2F" stroke-width="8" stroke-linejoin="round"/>`;
    }
  return out;
}

function tub(x: number, y: number, color: string) {
  return `<rect x="${x}" y="${y + 40}" width="140" height="200" rx="18" fill="${WHITE}"/>
    <rect x="${x}" y="${y + 120}" width="140" height="70" fill="${color}" opacity="0.85"/>
    <rect x="${x - 10}" y="${y}" width="160" height="56" rx="16" fill="${color}"/>
    <rect x="${x + 10}" y="${y + 8}" width="60" height="12" rx="6" fill="${WHITE}" opacity="0.35"/>`;
}

function star(cx: number, cy: number, r: number, color: string) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${color}" stroke-linejoin="round"/>`;
}

export const BACKGROUNDS = ['#FDEEE8', '#FFF1C9', '#DDF2EE', '#E6E9FF', '#FCE4F1', '#E3F1FB', '#F6F1E9'];

/** Square product illustration. `variant` produces an alternate composition for galleries. */
export function productSvg(kind: ArtKind, color: string, background: string, variant: 0 | 1 | 2 = 0): string {
  const transforms = ['', 'translate(400 400) scale(0.82) rotate(-6) translate(-400 -400)', 'translate(400 400) scale(1.25) translate(-400 -380)'];
  const deco =
    variant === 1
      ? `<circle cx="120" cy="130" r="46" fill="${color}" opacity="0.12"/><circle cx="690" cy="680" r="70" fill="${color}" opacity="0.10"/>`
      : variant === 0
        ? `<circle cx="680" cy="120" r="56" fill="#FFFFFF" opacity="0.55"/><circle cx="110" cy="700" r="38" fill="#FFFFFF" opacity="0.55"/>`
        : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="${background}"/>${deco}
    <g transform="${transforms[variant]}">${art[kind](color)}</g></svg>`;
}

/** Wide storefront hero illustration. */
export function heroSvg(): string {
  const place = (kind: ArtKind, color: string, x: number, y: number, s: number, r = 0) =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-400 -400)">${art[kind](color)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
    <rect width="1600" height="900" fill="#FDEEE8"/>
    <circle cx="1240" cy="420" r="380" fill="#FFF1C9"/>
    <circle cx="1450" cy="130" r="90" fill="#DDF2EE"/>
    <circle cx="960" cy="760" r="120" fill="#E6E9FF"/>
    ${place('blocks', '#7B6CF6', 1010, 560, 0.55, -4)}
    ${place('teddy', '#C68B59', 1290, 420, 0.72)}
    ${place('car', '#E4572E', 1080, 300, 0.45, 6)}
    ${place('kite', '#0F8B8D', 1480, 330, 0.32, 12)}
    ${place('cube', '#000', 1480, 690, 0.3, 0)}
    ${place('rings', '#000', 860, 330, 0.3, 0)}
  </svg>`;
}

/** Simple brand mark used as the default store logo. */
export function logoSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="120" fill="#E4572E"/>
    <path d="M168 120 L168 392" stroke="#FFFFFF" stroke-width="64" stroke-linecap="round"/>
    <path d="M352 120 L200 256 L352 392" stroke="#FFFFFF" stroke-width="64" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="392" cy="112" r="36" fill="#FFC53D"/>
  </svg>`;
}
