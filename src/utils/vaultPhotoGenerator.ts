import { MetalType } from '../types/bullion';

export interface VaultPhotoGenerationInput {
  clientId: string;
  vaultId: string;
  clientName: string;
  category: 'Gold' | 'Silver' | 'Diamond';
  quantityValue: number; // kg for Gold/Silver, carats for Diamond
  diamondValueUSD?: number;
  serialNumber: string;
  vaultBay: string;
}

function xfnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface BarSpec {
  label: string;
  weightText: string;
  purityText: string;
  serial: string;
  scale: number; // 1.0 = 1kg or 100oz, 0.62 = 100g
}

function buildGoldBars(goldKg: number, serialSeed: string): { bars: BarSpec[]; overflowCount: number } {
  const totalGrams = Math.max(0, Math.round(goldKg * 1000));
  const kgCount = Math.floor(totalGrams / 1000);
  const remGrams = totalGrams % 1000;
  const g100Count = Math.floor(remGrams / 100);
  const remAfter100 = remGrams % 100;

  const specs: BarSpec[] = [];
  const maxRenderedKg = 20;
  const renderedKg = Math.min(kgCount, maxRenderedKg);

  for (let i = 0; i < renderedKg; i++) {
    specs.push({
      label: 'BULLIONSTAR',
      weightText: '1000g',
      purityText: 'FINE GOLD 999.9',
      serial: `${serialSeed}-${String(i + 1).padStart(2, '0')}`,
      scale: 1,
    });
  }

  const maxRenderedSmall = Math.max(0, 20 - specs.length);
  const rendered100g = Math.min(g100Count, maxRenderedSmall);
  for (let i = 0; i < rendered100g; i++) {
    specs.push({
      label: 'PAMP SUISSE',
      weightText: '100g',
      purityText: '999.9 GOLD',
      serial: `${serialSeed}-M${String(i + 1).padStart(2, '0')}`,
      scale: 0.68,
    });
  }

  if (remAfter100 >= 10 && specs.length < 20) {
    specs.push({
      label: 'HERAEUS',
      weightText: `${remAfter100}g`,
      purityText: '999.9 GOLD',
      serial: `${serialSeed}-F01`,
      scale: 0.56,
    });
  }

  if (specs.length === 0 && goldKg > 0) {
    specs.push({
      label: 'BULLIONSTAR',
      weightText: `${Math.max(1, totalGrams)}g`,
      purityText: '999.9 GOLD',
      serial: `${serialSeed}-01`,
      scale: 0.72,
    });
  }

  return {
    bars: specs,
    overflowCount: Math.max(0, kgCount - renderedKg),
  };
}

function buildSilverBars(silverKg: number, serialSeed: string): { bars: BarSpec[]; overflowCount: number; ozTotal: number } {
  const ozTotal = silverKg * 32.1507;
  const hundredOzCount = Math.floor((ozTotal + 2) / 100); // e.g., 15.55 kg = 500 oz => 5 x 100oz
  const specs: BarSpec[] = [];

  if (hundredOzCount >= 1 && Math.abs(ozTotal - hundredOzCount * 100) <= 25) {
    const rendered = Math.min(hundredOzCount, 16);
    for (let i = 0; i < rendered; i++) {
      specs.push({
        label: 'ROYAL CANADIAN',
        weightText: '100 OZ',
        purityText: '999.9 FINE SILVER',
        serial: `${serialSeed}-${String(i + 1).padStart(2, '0')}`,
        scale: 1,
      });
    }
    return { bars: specs, overflowCount: Math.max(0, hundredOzCount - rendered), ozTotal };
  }

  const kgCount = Math.max(1, Math.round(silverKg));
  const rendered = Math.min(kgCount, 18);
  for (let i = 0; i < rendered; i++) {
    specs.push({
      label: 'NADIR METAL',
      weightText: silverKg < 1 ? `${Math.round(silverKg * 1000)}g` : '1000g',
      purityText: '999.0 FINE SILVER',
      serial: `${serialSeed}-${String(i + 1).padStart(2, '0')}`,
      scale: silverKg < 1 ? 0.78 : 0.94,
    });
  }
  return { bars: specs, overflowCount: Math.max(0, kgCount - rendered), ozTotal };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBullionBar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angleRad: number,
  spec: BarSpec,
  metal: 'Gold' | 'Silver'
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleRad);

  // Soft realistic tray shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 10;

  // Outer beveled bar body (3D rim)
  const rimGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  if (metal === 'Gold') {
    rimGrad.addColorStop(0, '#F5D67B');
    rimGrad.addColorStop(0.28, '#D4AF37');
    rimGrad.addColorStop(0.6, '#9B7315');
    rimGrad.addColorStop(1, '#6E4E0A');
  } else {
    rimGrad.addColorStop(0, '#F1F5F9');
    rimGrad.addColorStop(0.32, '#CBD5E1');
    rimGrad.addColorStop(0.65, '#64748B');
    rimGrad.addColorStop(1, '#334155');
  }
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, Math.max(8, w * 0.08));
  ctx.fillStyle = rimGrad;
  ctx.fill();

  // Clear shadow for inner face
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Inner top face with brushed metallic sheen
  const pad = Math.max(5, w * 0.055);
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const faceGrad = ctx.createLinearGradient(-iw / 2, -ih / 2, iw / 2, ih / 2);
  if (metal === 'Gold') {
    faceGrad.addColorStop(0, '#FFF1B8');
    faceGrad.addColorStop(0.22, '#E7C14E');
    faceGrad.addColorStop(0.55, '#C89824');
    faceGrad.addColorStop(0.85, '#E2BA4A');
    faceGrad.addColorStop(1, '#A67C18');
  } else {
    faceGrad.addColorStop(0, '#FFFFFF');
    faceGrad.addColorStop(0.22, '#E2E8F0');
    faceGrad.addColorStop(0.55, '#94A3B8');
    faceGrad.addColorStop(0.85, '#CBD5E1');
    faceGrad.addColorStop(1, '#64748B');
  }
  drawRoundedRect(ctx, -iw / 2, -ih / 2, iw, ih, Math.max(6, iw * 0.07));
  ctx.fillStyle = faceGrad;
  ctx.fill();

  // Subtle recessed inner bevel stroke
  ctx.strokeStyle = metal === 'Gold' ? 'rgba(92, 62, 6, 0.55)' : 'rgba(30, 41, 59, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Specular glint diagonal stripe
  ctx.save();
  drawRoundedRect(ctx, -iw / 2, -ih / 2, iw, ih, Math.max(6, iw * 0.07));
  ctx.clip();
  const shineGrad = ctx.createLinearGradient(-iw, -ih * 0.4, iw, ih * 0.4);
  shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
  shineGrad.addColorStop(0.45, 'rgba(255,255,255,0.22)');
  shineGrad.addColorStop(0.55, 'rgba(255,255,255,0.03)');
  shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shineGrad;
  ctx.fillRect(-iw / 2, -ih / 2, iw, ih);
  ctx.restore();

  // Engraved refinery markings
  const inkDark = metal === 'Gold' ? '#4F3506' : '#1E293B';
  const inkHighlight = metal === 'Gold' ? 'rgba(255,245,200,0.45)' : 'rgba(255,255,255,0.6)';

  const drawEngravedText = (text: string, yOffset: number, fontSize: number, bold = true, mono = false) => {
    ctx.font = `${bold ? '700' : '600'} ${Math.max(8, Math.round(fontSize))}px ${
      mono ? '"JetBrains Mono", monospace' : '"Plus Jakarta Sans", sans-serif'
    }`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = inkHighlight;
    ctx.fillText(text, 0.7, yOffset + 0.8);
    ctx.fillStyle = inkDark;
    ctx.fillText(text, 0, yOffset);
  };

  drawEngravedText(spec.label, -ih * 0.28, w * 0.095, true, false);
  drawEngravedText(spec.weightText, -ih * 0.05, w * 0.165, true, false);
  drawEngravedText(spec.purityText, ih * 0.13, w * 0.078, true, false);

  // Stamped serial pill box
  const boxW = iw * 0.78;
  const boxH = Math.max(14, ih * 0.14);
  drawRoundedRect(ctx, -boxW / 2, ih * 0.25, boxW, boxH, 3);
  ctx.fillStyle = metal === 'Gold' ? 'rgba(85, 58, 7, 0.14)' : 'rgba(15, 23, 42, 0.12)';
  ctx.fill();
  drawEngravedText(spec.serial, ih * 0.25 + boxH / 2, w * 0.072, true, true);

  ctx.restore();
}

function drawDiamondStone(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  caratLabel: string,
  giaLabel: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Sealed tamper-evident acrylic velvet cradle beneath stone
  const cradleW = radius * 3.1;
  const cradleH = radius * 3.5;
  ctx.shadowColor = 'rgba(0,0,0,0.72)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 8;
  drawRoundedRect(ctx, -cradleW / 2, -cradleH / 2 + 12, cradleW, cradleH, 10);
  ctx.fillStyle = '#0B1324';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Brilliant diamond radial halo
  const halo = ctx.createRadialGradient(0, -8, radius * 0.1, 0, -8, radius * 1.4);
  halo.addColorStop(0, 'rgba(224, 242, 254, 0.35)');
  halo.addColorStop(1, 'rgba(224, 242, 254, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, -8, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Faceted crown & pavilion
  ctx.save();
  ctx.translate(0, -10);
  ctx.rotate(rotation);

  const sides = 16;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  const stoneGrad = ctx.createRadialGradient(-radius * 0.25, -radius * 0.25, 2, 0, 0, radius);
  stoneGrad.addColorStop(0, '#FFFFFF');
  stoneGrad.addColorStop(0.45, '#E0F2FE');
  stoneGrad.addColorStop(0.8, '#93C5FD');
  stoneGrad.addColorStop(1, '#38BDF8');
  ctx.fillStyle = stoneGrad;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Star & kite facets
  for (let i = 0; i < sides; i++) {
    const a1 = (i / sides) * Math.PI * 2;
    const a2 = ((i + 1) / sides) * Math.PI * 2;
    const mid = (a1 + a2) / 2;

    ctx.beginPath();
    ctx.moveTo(Math.cos(a1) * radius, Math.sin(a1) * radius);
    ctx.lineTo(Math.cos(mid) * radius * 0.56, Math.sin(mid) * radius * 0.56);
    ctx.lineTo(Math.cos(a2) * radius, Math.sin(a2) * radius);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.68)' : 'rgba(148, 163, 184, 0.36)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Octagonal table facet
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * radius * 0.44;
    const y = Math.sin(a) * radius * 0.44;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Specular sparkle cross
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  const sx = -radius * 0.35;
  const sy = -radius * 0.35;
  ctx.beginPath();
  ctx.moveTo(sx - 10, sy);
  ctx.lineTo(sx + 10, sy);
  ctx.moveTo(sx, sy - 10);
  ctx.lineTo(sx, sy + 10);
  ctx.stroke();

  ctx.restore();

  // Engraved GIA parcel placard at bottom of cradle
  ctx.fillStyle = '#F2D06B';
  ctx.font = '700 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(caratLabel, 0, radius + 24);
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillText(giaLabel, 0, radius + 42);

  ctx.restore();
}

export function generateVaultVerificationPhoto(input: VaultPhotoGenerationInput): string {
  if (typeof document === 'undefined') return '';

  const width = 1600;
  const height = 1120;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const seedStr = `${input.clientId}|${input.vaultId}|${input.category}|${input.quantityValue.toFixed(4)}`;
  const seed = xfnv1a(seedStr);
  const rand = mulberry32(seed);
  const shortSeed = (seed >>> 0).toString(36).toUpperCase().slice(0, 4).padStart(4, '0');
  const serialPrefix = `SG${(input.vaultId || '001').replace(/[^A-Z0-9]/gi, '').slice(-4)}${shortSeed.slice(0, 2)}`;

  // 1. Brushed stainless steel Singapore vault bench background
  const steelGrad = ctx.createLinearGradient(0, 0, width, height);
  steelGrad.addColorStop(0, '#1B2434');
  steelGrad.addColorStop(0.5, '#111827');
  steelGrad.addColorStop(1, '#090D16');
  ctx.fillStyle = steelGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle brushed metal micro-lines
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Overhead studio inspection spotlight
  const spotX = width * (0.42 + rand() * 0.16);
  const spotY = height * (0.36 + rand() * 0.14);
  const spotlight = ctx.createRadialGradient(spotX, spotY, 40, spotX, spotY, 820);
  spotlight.addColorStop(0, 'rgba(255, 248, 225, 0.13)');
  spotlight.addColorStop(0.55, 'rgba(148, 163, 184, 0.05)');
  spotlight.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = spotlight;
  ctx.fillRect(0, 0, width, height);

  // 2. Luxury Velvet Inspection Tray
  const trayX = 76;
  const trayY = 74;
  const trayW = width - 152;
  const trayH = height - 210;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 16;
  drawRoundedRect(ctx, trayX, trayY, trayW, trayH, 18);
  ctx.fillStyle = '#0D1F3C';
  ctx.fill();
  ctx.restore();

  // Tray gold trim lip
  drawRoundedRect(ctx, trayX, trayY, trayW, trayH, 18);
  ctx.strokeStyle = 'rgba(197, 155, 39, 0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner dark velvet felt pad
  const padInset = 24;
  drawRoundedRect(ctx, trayX + padInset, trayY + padInset, trayW - padInset * 2, trayH - padInset * 2, 12);
  const feltGrad = ctx.createRadialGradient(spotX, spotY, 60, width / 2, height / 2, trayW * 0.75);
  feltGrad.addColorStop(0, input.category === 'Diamond' ? '#12192B' : '#13223B');
  feltGrad.addColorStop(1, '#070E1C');
  ctx.fillStyle = feltGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner usable coordinates
  const areaX = trayX + padInset + 40;
  const areaY = trayY + padInset + 36;
  const areaW = trayW - padInset * 2 - 80;
  const areaH = trayH - padInset * 2 - 72;

  let summaryMetricText = '';
  let overflowBanner = '';

  // 3. Render exact client quantities
  if (input.category === 'Gold') {
    const { bars, overflowCount } = buildGoldBars(input.quantityValue, `AU-${serialPrefix}`);
    const count = bars.length;
    const cols = count === 1 ? 1 : count <= 2 ? 2 : count <= 4 ? 2 : count <= 6 ? 3 : count <= 10 ? 5 : count <= 15 ? 5 : 5;
    const rows = Math.max(1, Math.ceil(count / cols));

    const maxCellW = areaW / cols;
    const maxCellH = areaH / rows;
    const baseBarW = count === 1 ? 300 : count <= 2 ? 250 : count <= 4 ? 225 : count <= 6 ? 205 : 172;
    const baseBarH = baseBarW * 1.62;
    const fitScale = Math.min(1, (maxCellW * 0.82) / baseBarW, (maxCellH * 0.86) / baseBarH);

    bars.forEach((bar, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const itemsInThisRow = row === rows - 1 ? count - row * cols : cols;
      const rowOffsetX = ((cols - itemsInThisRow) * maxCellW) / 2;

      const cx = areaX + rowOffsetX + maxCellW * (col + 0.5) + (rand() - 0.5) * 10;
      const cy = areaY + maxCellH * (row + 0.5) + (rand() - 0.5) * 8;
      const angle = (rand() - 0.5) * (count === 1 ? 0.04 : 0.065);

      const bw = baseBarW * fitScale * bar.scale;
      const bh = baseBarH * fitScale * bar.scale;
      drawBullionBar(ctx, cx, cy, bw, bh, angle, bar, 'Gold');
    });

    summaryMetricText = `${input.quantityValue.toFixed(2)} KG GOLD (${count + overflowCount} BARS)`;
    if (overflowCount > 0) {
      overflowBanner = `+${overflowCount} additional sealed 1 kg bars stacked in adjacent pallet`;
    }
  } else if (input.category === 'Silver') {
    const { bars, overflowCount, ozTotal } = buildSilverBars(input.quantityValue, `AG-${serialPrefix}`);
    const count = bars.length;
    const cols = count === 1 ? 1 : count <= 3 ? count : count <= 6 ? 3 : count <= 12 ? 4 : 5;
    const rows = Math.max(1, Math.ceil(count / cols));

    const maxCellW = areaW / cols;
    const maxCellH = areaH / rows;
    const baseBarW = count === 1 ? 340 : count <= 3 ? 280 : count <= 6 ? 240 : 195;
    const baseBarH = baseBarW * 1.48;
    const fitScale = Math.min(1, (maxCellW * 0.84) / baseBarW, (maxCellH * 0.86) / baseBarH);

    bars.forEach((bar, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const itemsInThisRow = row === rows - 1 ? count - row * cols : cols;
      const rowOffsetX = ((cols - itemsInThisRow) * maxCellW) / 2;

      const cx = areaX + rowOffsetX + maxCellW * (col + 0.5) + (rand() - 0.5) * 10;
      const cy = areaY + maxCellH * (row + 0.5) + (rand() - 0.5) * 8;
      const angle = (rand() - 0.5) * 0.055;

      const bw = baseBarW * fitScale * bar.scale;
      const bh = baseBarH * fitScale * bar.scale;
      drawBullionBar(ctx, cx, cy, bw, bh, angle, bar, 'Silver');
    });

    summaryMetricText = `${input.quantityValue.toFixed(2)} KG (${Math.round(ozTotal)} OZ) SILVER`;
    if (overflowCount > 0) {
      overflowBanner = `+${overflowCount} additional cast silver bars in sealed stack`;
    }
  } else {
    // Certified Diamonds
    const totalCt = Math.max(0.25, input.quantityValue);
    const parcelCount = Math.min(8, Math.max(1, Math.round(totalCt / 0.9)));
    const cols = parcelCount === 1 ? 1 : parcelCount <= 4 ? parcelCount : 4;
    const rows = Math.ceil(parcelCount / cols);
    const maxCellW = areaW / cols;
    const maxCellH = areaH / rows;

    let remainingCt = totalCt;
    for (let i = 0; i < parcelCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const itemsInThisRow = row === rows - 1 ? parcelCount - row * cols : cols;
      const rowOffsetX = ((cols - itemsInThisRow) * maxCellW) / 2;

      const stoneCt =
        i === parcelCount - 1
          ? remainingCt
          : Number(Math.max(0.35, (totalCt / parcelCount) * (0.85 + rand() * 0.3)).toFixed(2));
      remainingCt = Math.max(0.2, Number((remainingCt - stoneCt).toFixed(2)));

      const cx = areaX + rowOffsetX + maxCellW * (col + 0.5);
      const cy = areaY + maxCellH * (row + 0.5) - 6;
      const radius = parcelCount === 1 ? 92 : parcelCount <= 3 ? 72 : 56;
      const giaCode = `GIA-${serialPrefix}${String(410 + i * 73)}`;

      drawDiamondStone(
        ctx,
        cx,
        cy,
        radius,
        rand() * Math.PI,
        `${stoneCt.toFixed(2)} CT · D/IF`,
        giaCode
      );
    }

    summaryMetricText = `${totalCt.toFixed(2)} CT GIA DIAMONDS (${parcelCount} PARCEL${parcelCount > 1 ? 'S' : ''})`;
  }

  // 4. Institutional Vault Custody Placard Footer Strip (camera metadata & client proof)
  const barY = height - 110;
  ctx.fillStyle = '#070F1E';
  ctx.fillRect(0, barY, width, 110);
  ctx.fillStyle = '#C59B27';
  ctx.fillRect(0, barY, width, 3);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#F2D06B';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText(`BULLIONSTAR SINGAPORE · HIGH-RES VAULT INTAKE PHOTO`, 44, barY + 34);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText(
    `CLIENT: ${(input.clientName || 'VERIFIED HOLDER').toUpperCase()}  |  VAULT: ${input.vaultId || 'BS-SG'}  |  BAY: ${input.vaultBay}`,
    44,
    barY + 68
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillText(summaryMetricText, width - 44, barY + 34);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 14px "JetBrains Mono", monospace';
  ctx.fillText(
    overflowBanner || `REF: ${input.serialNumber}  ·  SEED #${shortSeed}`,
    width - 44,
    barY + 68
  );

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function isMetalCategory(cat: string): cat is MetalType {
  return ['Gold', 'Silver', 'Platinum', 'Palladium', 'Diamond'].includes(cat);
}
