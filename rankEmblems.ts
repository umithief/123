// Rütbe amblemleri: kariyer yolundaki 7 kademe için sıfırdan tasarlanmış, hareketli armalar.
// Profil çerçeveleriyle aynı canvas motorunda çizilir. Kademe yükseldikçe biçim, malzeme ve hareket zenginleşir:
// çelik disk → bronz kalkan → gümüş altıgen → altın kalkan → platin yıldız → obsidyen yıldız → beyaz altın güneş.
// Fasetli yüzeyler yavaşça dönen ışıkla parlar; mavi tonlar tema renginden (--moto-accent) gelir.

import { FrameDef, mountScene, RGB, TAU, DEG, clamp, lerp, rgba, mix, WHITE, bloom, star } from './premiumFrames';

export type EmblemTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const RANK_EMBLEMS: { tier: EmblemTier; name: string; minApex: number }[] = [
    { tier: 1, name: 'Çaylak Sürücü', minApex: 0 },
    { tier: 2, name: 'Sokak Pilotu', minApex: 500 },
    { tier: 3, name: 'Asfalt Kâşifi', minApex: 2000 },
    { tier: 4, name: 'Rota Komutanı', minApex: 5000 },
    { tier: 5, name: 'Kademe Ustası', minApex: 12000 },
    { tier: 6, name: 'Elit Sürücü', minApex: 20000 },
    { tier: 7, name: 'Efsane Sürücü', minApex: 35000 },
];

// Verilen Apex puanının hak ettiği kademe
export const emblemTierForApex = (apex: number): EmblemTier =>
    RANK_EMBLEMS.reduce((best, e) => (apex >= e.minApex ? e.tier : best), 1 as EmblemTier);

type Pt = [number, number];

const STEEL = ['#3a4048', '#8d96a1', '#d7dde4', '#5d6570', '#2c3138'];
const BRONZE = ['#4d2b10', '#b97a3e', '#f1c48c', '#94592a', '#5e3615'];
const SILVER = ['#6f7780', '#e6ebf0', '#ffffff', '#aab3bd', '#78818b'];
const GOLD = ['#7a5412', '#f3d572', '#fff7d1', '#d9a733', '#8c6315'];
const PLATINUM = ['#8a919a', '#f2f5f8', '#ffffff', '#c6ced7', '#959da6'];
const OBSIDIAN = ['#08090c', '#3a3f4a', '#8e98a6', '#1b1e25', '#050607'];
const WHITE_GOLD = ['#c9a24a', '#fff1c4', '#ffffff', '#f3d98a', '#d6b25a'];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// --- ŞEKİLLER ---

const polyPts = (n: number, r: number, rot = -Math.PI / 2): Pt[] =>
    Array.from({ length: n }, (_, i) => { const a = rot + (i / n) * TAU; return [r * Math.cos(a), r * Math.sin(a)]; });

const starPts = (n: number, ro: number, ri: number, rot = -Math.PI / 2): Pt[] =>
    Array.from({ length: n * 2 }, (_, i) => { const a = rot + (i / (n * 2)) * TAU, r = i % 2 ? ri : ro; return [r * Math.cos(a), r * Math.sin(a)]; });

// Klasik arma kalkanı: düz üst kenar, kavisle sivri alta iner
const shieldPts = (w: number, h: number): Pt[] => {
    const right: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
        const k = i / 10, u = 1 - k;
        right.push([u * u * w + 2 * u * k * w * 1.02 + k * k * 0, u * u * (-0.6 * h) + 2 * u * k * (0.3 * h) + k * k * h]);
    }
    const top: Pt[] = [[-w * 0.4, -0.6 * h], [0, -0.7 * h], [w * 0.4, -0.6 * h]];
    const left = right.slice(0, -1).reverse().map(([x, y]) => [-x, y] as Pt);
    return [...top, ...right, ...left];
};

const tracePts = (ctx: CanvasRenderingContext2D, pts: Pt[]) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
};

const scalePts = (pts: Pt[], k: number, dy = 0): Pt[] => pts.map(([x, y]) => [x * k, y * k + dy]);

const metal = (ctx: CanvasRenderingContext2D, stops: string[], angle: number, repeat: number): CanvasGradient => {
    const n = stops.length;
    if (!ctx.createConicGradient) {
        const lin = ctx.createLinearGradient(-80, -80, 80, 80);
        stops.forEach((c, i) => lin.addColorStop(i / (n - 1), c));
        return lin;
    }
    const g = ctx.createConicGradient(angle, 0, 0);
    for (let r = 0; r < repeat; r++) for (let i = 0; i < n; i++) g.addColorStop((r + i / n) / repeat, stops[i]);
    g.addColorStop(1, stops[0]);
    return g;
};

// Fasetli metal gövde: her kenar merkezle bir üçgen yüz oluşturur, yüzün eğimi ışığa göre aydınlanır ya da gölgelenir
const facetBody = (ctx: CanvasRenderingContext2D, pts: Pt[], stops: string[], t: number, light: number, depth = 1) => {
    tracePts(ctx, pts);
    ctx.fillStyle = metal(ctx, stops, t * 0.3, 2); ctx.fill();
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]);
        if (nx * (a[0] + b[0]) + ny * (a[1] + b[1]) < 0) { nx = -nx; ny = -ny; }
        const shade = Math.cos(Math.atan2(ny, nx) - light) * depth;
        ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${0.34 * shade})` : `rgba(0,0,0,${0.42 * -shade})`;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.closePath(); ctx.fill();
    }
    tracePts(ctx, pts);
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 0.9; ctx.lineJoin = 'round'; ctx.stroke();
    tracePts(ctx, scalePts(pts, 0.97));
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 0.6; ctx.stroke();
};

// Mine yüzey: koyu renkli dolgu ve üstte cam gibi parlama
const enamelPts = (ctx: CanvasRenderingContext2D, pts: Pt[], c0: string, c1: string) => {
    const g = ctx.createRadialGradient(-10, -14, 2, 0, 0, 60);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    tracePts(ctx, pts); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.4; ctx.stroke();
};

const enamelCircle = (ctx: CanvasRenderingContext2D, r: number, c0: string, c1: string) => {
    enamelPts(ctx, polyPts(48, r), c0, c1);
};

const gloss = (ctx: CanvasRenderingContext2D, r: number) => {
    const g = ctx.createLinearGradient(0, -r, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -r * 0.42, r * 0.78, r * 0.5, 0, Math.PI, TAU); ctx.fill();
};

const ringMetal = (ctx: CanvasRenderingContext2D, r0: number, r1: number, stops: string[], angle: number) => {
    ctx.beginPath(); ctx.arc(0, 0, r1, 0, TAU); ctx.arc(0, 0, r0, 0, TAU, true);
    ctx.fillStyle = metal(ctx, stops, angle, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(0, 0, r0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.arc(0, 0, r1 - 0.4, 0, TAU); ctx.stroke();
};

const gem = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, light: string, dark: string, setting: string) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const d = (r: number) => { ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.closePath(); };
    ctx.fillStyle = setting; d(size + 1.2); ctx.fill();
    ctx.fillStyle = dark; d(size); ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(0, -size); ctx.lineTo(size, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath(); ctx.moveTo(-size * 0.5, -size * 0.1); ctx.lineTo(0, -size * 0.7); ctx.lineTo(size * 0.1, -size * 0.1); ctx.closePath(); ctx.fill();
    ctx.restore();
};

// Alt şerit ve Roma rakamı
const ribbon = (ctx: CanvasRenderingContext2D, y: number, w: number, label: string, stops: string[], ink: string) => {
    const g = ctx.createLinearGradient(0, y - 7, 0, y + 7);
    g.addColorStop(0, stops[2]); g.addColorStop(0.5, stops[1]); g.addColorStop(1, stops[0]);
    for (const side of [-1, 1]) {
        ctx.fillStyle = stops[4];
        ctx.beginPath();
        ctx.moveTo(side * (w - 3), y - 3); ctx.lineTo(side * (w + 9), y - 3); ctx.lineTo(side * (w + 5), y + 3.5);
        ctx.lineTo(side * (w + 9), y + 10); ctx.lineTo(side * (w - 3), y + 10);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 0.6; ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-w, y - 6.5); ctx.quadraticCurveTo(0, y - 9.5, w, y - 6.5);
    ctx.lineTo(w, y + 6.5); ctx.quadraticCurveTo(0, y + 3.5, -w, y + 6.5);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = '900 9px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, y - 0.6);
};

// --- SEMBOLLER (kariyer yolundaki ikonlarla aynı fikir, çizgi ikon olarak) ---

const iconStroke = (ctx: CanvasRenderingContext2D, color: string, w = 3) => {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
};

const iconBike = (ctx: CanvasRenderingContext2D, color: string, t: number) => {
    iconStroke(ctx, color, 2.6);
    for (const x of [-10, 10]) {
        ctx.save(); ctx.translate(x, 5); ctx.rotate(t * 2);
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.lineWidth = 0.8; ctx.stroke();
        ctx.restore();
    }
    iconStroke(ctx, color, 2.6);
    ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-2, -5); ctx.lineTo(7, -5); ctx.lineTo(10, 5);
    ctx.moveTo(-2, -5); ctx.lineTo(2, 4); ctx.moveTo(5, -5); ctx.lineTo(9, -11); ctx.lineTo(12, -11); ctx.stroke();
};

const iconTrend = (ctx: CanvasRenderingContext2D, color: string) => {
    iconStroke(ctx, color, 3.2);
    ctx.beginPath(); ctx.moveTo(-13, 9); ctx.lineTo(-4, -1); ctx.lineTo(2, 5); ctx.lineTo(12, -7);
    ctx.moveTo(4, -7); ctx.lineTo(12, -7); ctx.lineTo(12, 1); ctx.stroke();
};

const iconCompass = (ctx: CanvasRenderingContext2D, color: string, needle: number, accent: RGB) => {
    iconStroke(ctx, color, 2.4);
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.stroke();
    ctx.save(); ctx.rotate(needle);
    ctx.fillStyle = rgba(mix(accent, WHITE, 0.2), 1);
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(3.4, 0); ctx.lineTo(-3.4, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(3.4, 0); ctx.lineTo(-3.4, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 1.3, 0, TAU); ctx.fill();
};

const iconNavigate = (ctx: CanvasRenderingContext2D, color: string) => {
    iconStroke(ctx, color, 2.8);
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(10.5, 12); ctx.lineTo(0, 6); ctx.lineTo(-10.5, 12); ctx.closePath(); ctx.stroke();
};

const iconMedal = (ctx: CanvasRenderingContext2D, color: string) => {
    iconStroke(ctx, color, 2.6);
    ctx.beginPath(); ctx.moveTo(-8, -13); ctx.lineTo(-3, -1); ctx.moveTo(8, -13); ctx.lineTo(3, -1); ctx.moveTo(-8, -13); ctx.lineTo(8, -13); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 6, 7.5, 0, TAU); ctx.stroke();
    ctx.font = '900 8px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('5', 0, 6.6);
};

const iconGauge = (ctx: CanvasRenderingContext2D, color: string, needle: number, red: string) => {
    iconStroke(ctx, color, 2.6);
    ctx.beginPath(); ctx.arc(0, 4, 13, Math.PI * 1.1, Math.PI * 1.9 - 0.25); ctx.stroke();
    ctx.strokeStyle = red; ctx.beginPath(); ctx.arc(0, 4, 13, Math.PI * 1.9 - 0.22, Math.PI * 1.9); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
        const a = Math.PI * 1.1 + (i / 6) * Math.PI * 0.8;
        ctx.moveTo(4 + 8 * Math.cos(a) - 4, 4 + 8 * Math.sin(a)); ctx.lineTo(10 * Math.cos(a), 4 + 10 * Math.sin(a));
    }
    ctx.stroke();
    const a = Math.PI * 1.1 + needle * Math.PI * 0.8;
    iconStroke(ctx, needle > 0.85 ? red : '#ffffff', 2.2);
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(11 * Math.cos(a), 4 + 11 * Math.sin(a)); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 4, 2.4, 0, TAU); ctx.fill();
};

const iconAward = (ctx: CanvasRenderingContext2D, color: string) => {
    iconStroke(ctx, color, 2.6);
    ctx.beginPath(); ctx.arc(0, -4, 8.5, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 3); ctx.lineTo(-7.5, 14); ctx.lineTo(0, 10.5); ctx.lineTo(7.5, 14); ctx.lineTo(5, 3); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -4, 3, 0, TAU); ctx.fill();
};

// --- SÜSLER ---

const wings = (ctx: CanvasRenderingContext2D, t: number, ax: number, ay: number, scale: number, layers: number, stops: string[], tip: string, outline: string) => {
    const spec: [number, number, number, number, number][] = [[8, 70, -60, 18, 0.24], [7, 52, -54, 12, 0.1], [6, 38, -48, 8, 0]];
    for (const side of [1, -1]) {
        ctx.save();
        ctx.scale(side, 1); ctx.translate(ax, ay);
        spec.slice(3 - layers).forEach(([n, lmax, a0, a1, shade], li) => {
            for (let i = n - 1; i >= 0; i--) {
                const k = i / (n - 1);
                const ang = lerp(a0, a1, k) * DEG * (1 + 0.04 * Math.sin(t * 1.3)) + 0.02 * Math.sin(t * 1.3 + i * 0.6);
                const len = lmax * scale * (1 - 0.45 * k ** 1.5), w = len * 0.17;
                ctx.save(); ctx.rotate(ang);
                const g = ctx.createLinearGradient(0, 0, len, 0);
                g.addColorStop(0, stops[0]); g.addColorStop(0.35, stops[1]); g.addColorStop(0.7, stops[2]); g.addColorStop(1, tip);
                ctx.beginPath(); ctx.moveTo(0, 0);
                ctx.bezierCurveTo(len * 0.3, -w, len * 0.8, -w * 0.9, len, 0);
                ctx.bezierCurveTo(len * 0.75, w * 0.5, len * 0.3, w * 0.6, 0, 0);
                ctx.fillStyle = g; ctx.fill();
                if (shade) { ctx.fillStyle = `rgba(0,0,0,${shade})`; ctx.fill(); }
                const sh = Math.max(0, Math.sin(t * 2.2 - i * 0.55 - li)) ** 8;
                if (sh > 0.02) { ctx.fillStyle = `rgba(255,255,255,${0.5 * sh})`; ctx.fill(); }
                ctx.strokeStyle = outline; ctx.lineWidth = 0.5; ctx.stroke();
                ctx.restore();
            }
        });
        ctx.restore();
    }
};

const laurel = (ctx: CanvasRenderingContext2D, t: number, r: number, from: number, to: number) => {
    const leafGrad = ctx.createLinearGradient(0, -3, 0, 3);
    leafGrad.addColorStop(0, '#fff1b8'); leafGrad.addColorStop(0.45, '#e2b54a'); leafGrad.addColorStop(1, '#8a6115');
    for (const side of [1, -1]) {
        ctx.strokeStyle = 'rgba(150,108,28,.9)'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        if (side === 1) ctx.arc(0, 0, r, from * DEG, to * DEG, true); else ctx.arc(0, 0, r, Math.PI - from * DEG, Math.PI - to * DEG, false);
        ctx.stroke();
        const N = 8;
        for (let i = 0; i < N; i++) {
            const u = i / (N - 1), ang = lerp(from, to, u) * DEG;
            const x = side * r * Math.cos(ang), y = r * Math.sin(ang);
            const base = Math.atan2(-Math.cos(ang), side * Math.sin(ang));
            const len = lerp(11, 6.5, u);
            const sh = Math.exp(-(((u - (((t * 0.4) % 1.6) - 0.3)) / 0.12) ** 2));
            for (const k of [1, -1]) {
                ctx.save(); ctx.translate(x, y); ctx.rotate(base + side * k * 0.6);
                ctx.beginPath(); ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(len * 0.45, -len * 0.36, len, 0); ctx.quadraticCurveTo(len * 0.45, len * 0.36, 0, 0);
                ctx.fillStyle = leafGrad; ctx.fill();
                if (sh > 0.02) { ctx.fillStyle = `rgba(255,255,255,${0.55 * sh})`; ctx.fill(); }
                ctx.restore();
            }
        }
    }
};

const rays = (ctx: CanvasRenderingContext2D, t: number, n: number, r0: number, r1: number, cols: RGB[], alpha: number, speed: number) => {
    const grads = cols.map(c => {
        const g = ctx.createRadialGradient(0, 0, r0, 0, 0, r1);
        g.addColorStop(0, rgba(c, alpha)); g.addColorStop(1, rgba(c, 0));
        return g;
    });
    ctx.save(); ctx.rotate(t * speed);
    for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, hw = i % 2 ? 0.05 : 0.085, R = i % 2 ? r1 * 0.88 : r1;
        ctx.fillStyle = grads[i % grads.length];
        ctx.beginPath();
        ctx.moveTo(r0 * Math.cos(a - hw * 0.5), r0 * Math.sin(a - hw * 0.5));
        ctx.lineTo(R * Math.cos(a - hw), R * Math.sin(a - hw)); ctx.lineTo(R * Math.cos(a + hw), R * Math.sin(a + hw));
        ctx.lineTo(r0 * Math.cos(a + hw * 0.5), r0 * Math.sin(a + hw * 0.5));
        ctx.closePath(); ctx.fill();
    }
    ctx.restore();
};

const comet = (ctx: CanvasRenderingContext2D, r: number, ang: number, col: RGB, len: number, w: number) => {
    ctx.lineCap = 'butt';
    for (let i = 25; i >= 0; i--) {
        const d0 = (i / 26) * len, d1 = ((i + 1.15) / 26) * len, k = 1 - i / 26;
        ctx.strokeStyle = rgba(mix(col, WHITE, 0.5 * k * k), k * k);
        ctx.lineWidth = w * (0.3 + 0.7 * k);
        ctx.beginPath(); ctx.arc(0, 0, r, ang - d1, ang - d0); ctx.stroke();
    }
    bloom(ctx, r * Math.cos(ang), r * Math.sin(ang), w * 3.2, col, 0.95);
};

const flames = (ctx: CanvasRenderingContext2D, t: number, r0: number, inner: RGB, outer: RGB) => {
    const N = 26;
    for (const [scale, c0, c1, ph] of [[1, outer, [255, 190, 80] as RGB, 0], [0.6, inner, [255, 245, 220] as RGB, 1.7]] as [number, RGB, RGB, number][]) {
        const g = ctx.createRadialGradient(0, 0, r0 - 2, 0, 0, r0 + 26 * scale);
        g.addColorStop(0, rgba(c0, 1)); g.addColorStop(0.55, rgba(mix(c0, c1, 0.5), 0.9)); g.addColorStop(1, rgba(c1, 0));
        ctx.fillStyle = g;
        for (let i = 0; i < N; i++) {
            const a = (i / N) * TAU + ph * 0.1;
            const n = 0.5 + 0.25 * Math.sin(t * 5.1 + i * 2.3 + ph) + 0.25 * Math.sin(t * 8.7 + i * 4.1 + ph * 2);
            const h = (9 + 16 * n) * scale * (0.7 + 0.3 * Math.abs(Math.sin(i * 12.9898))) * (0.75 + 0.45 * (0.5 - 0.5 * Math.sin(a)));
            const sway = 0.06 * Math.sin(t * 4 + i * 1.3), hw = 0.11 * scale;
            const P = (r: number, an: number): Pt => [r * Math.cos(an), r * Math.sin(an)];
            const [bx0, by0] = P(r0 - 2, a - hw), [bx1, by1] = P(r0 - 2, a + hw), [tx, ty] = P(r0 + h, a + sway);
            const [lx, ly] = P(r0 + h * 0.45, a - hw * 1.25 + sway * 0.4), [rx, ry] = P(r0 + h * 0.5, a + hw * 0.9 + sway * 0.6);
            ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.quadraticCurveTo(lx, ly, tx, ty); ctx.quadraticCurveTo(rx, ry, bx1, by1); ctx.closePath(); ctx.fill();
        }
    }
};

const crown = (ctx: CanvasRenderingContext2D, y: number, accent: RGB, t: number) => {
    ctx.save();
    ctx.translate(0, y);
    const g = ctx.createLinearGradient(-19, -20, 19, 4);
    g.addColorStop(0, '#fff6d0'); g.addColorStop(0.45, '#e9bd4e'); g.addColorStop(1, '#9a6c14');
    ctx.beginPath();
    ctx.moveTo(-17, 4); ctx.lineTo(-19, -12); ctx.lineTo(-13, -6); ctx.lineTo(-9.5, -16); ctx.lineTo(-5, -6.5); ctx.lineTo(0, -20);
    ctx.lineTo(5, -6.5); ctx.lineTo(9.5, -16); ctx.lineTo(13, -6); ctx.lineTo(19, -12); ctx.lineTo(17, 4);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(100,66,8,.85)'; ctx.lineWidth = 0.7; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = 'rgba(120,80,10,.35)'; ctx.fillRect(-17, 0, 34, 4);
    for (const [x, yy] of [[-19, -12], [-9.5, -16], [0, -20], [9.5, -16], [19, -12]]) {
        ctx.fillStyle = '#fff3c4'; ctx.strokeStyle = 'rgba(100,66,8,.85)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.arc(x, yy, 1.7, 0, TAU); ctx.fill(); ctx.stroke();
    }
    bloom(ctx, 0, -4.5, 9, accent, 0.45 + 0.25 * Math.sin(t * 3));
    gem(ctx, 0, -4.5, 3.4, 0, rgba(mix(accent, WHITE, 0.45), 1), rgba(mix(accent, [0, 0, 0], 0.3), 1), '#7a5412');
    ctx.restore();
};

const sweep = (ctx: CanvasRenderingContext2D, pts: Pt[], t: number, cycle: number, alpha: number) => {
    const q = (t % cycle) / 1.3;
    if (q >= 1) return;
    ctx.save();
    tracePts(ctx, pts); ctx.clip();
    ctx.rotate(-Math.PI / 4);
    const x = lerp(-110, 110, q);
    const g = ctx.createLinearGradient(x - 16, 0, x + 16, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${alpha})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 16, -120, 32, 240);
    ctx.restore();
};

// --- SAHNE ---

interface Mote { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number }
interface EmblemState { motes: Mote[]; glints: { x: number; y: number; age: number; life: number; size: number }[]; acc: number; nextGlint: number; shock: number; stars: [number, number, number][] }

const MOTE_RATE = [0, 0, 0, 0, 2, 5, 9, 16];
const GLINT_EVERY = [0, 0, 0, 2.2, 1.4, 0.9, 0.6, 0.35];
const BODY_R = [0, 46, 52, 56, 60, 66, 70, 72];

const drawEmblem = (tier: EmblemTier, s: EmblemState, t: number, accent: RGB) => {
    return (ctx: CanvasRenderingContext2D) => {
        // Alt kademeler kutuda küçük kalmasın
        const k = [1, 1.22, 1.15, 1.08, 1, 1, 1, 1][tier];
        ctx.save(); ctx.scale(k, k);
        const light = -3 * Math.PI / 4 + (tier >= 3 ? 0.4 * Math.sin(t * 0.5) : 0);
        const blue = accent, blueHi = mix(accent, WHITE, 0.45), blueDeep = mix(accent, [0, 0, 0], 0.7);
        const GOLD_C: RGB = [255, 205, 90];

        // Arka hale: kademe yükseldikçe güçlenir
        const haloA = [0, 0.12, 0.16, 0.22, 0.3, 0.4, 0.5, 0.6][tier];
        const haloR = BODY_R[tier] + 30 + tier * 6;
        const hg = ctx.createRadialGradient(0, 0, BODY_R[tier] * 0.6, 0, 0, haloR);
        const haloC = tier >= 6 ? mix(blue, GOLD_C, tier === 6 ? 0.6 : 0.25) : blue;
        hg.addColorStop(0, rgba(haloC, haloA * (0.85 + 0.15 * Math.sin(t * 1.6)))); hg.addColorStop(1, rgba(haloC, 0));
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, haloR, 0, TAU); ctx.fill();

        if (tier >= 4) rays(ctx, t, tier === 4 ? 8 : tier === 5 ? 12 : 18, BODY_R[tier] - 8, tier === 7 ? 128 : tier === 6 ? 122 : 108,
            tier === 7 ? [GOLD_C, blueHi] : tier === 6 ? [GOLD_C] : [blueHi], tier === 4 ? 0.22 : tier === 5 ? 0.3 : 0.5, tier === 7 ? 0.12 : 0.07);
        for (const p of s.motes) {
            const k = clamp(p.life / p.max);
            ctx.fillStyle = rgba(mix(tier === 7 ? blueHi : GOLD_C, WHITE, 0.3 * k), Math.min(1, k * 1.5) * 0.9);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * k), 0, TAU); ctx.fill();
        }
        if (tier === 5) wings(ctx, t, 44, 8, 0.85, 2, SILVER, rgba(blueHi, 1), 'rgba(40,50,64,.6)');
        if (tier === 6) wings(ctx, t, 46, 10, 1, 3, GOLD, '#f3d572', 'rgba(70,45,5,.6)');
        if (tier === 7) wings(ctx, t, 48, 10, 1.12, 3, WHITE_GOLD, rgba(blueHi, 1), 'rgba(110,70,10,.55)');
        if (tier === 7) flames(ctx, t, 72, [200, 230, 255], blue);
        if (tier === 4) laurel(ctx, t, 60, 70, -40);

        // Gövde
        let body: Pt[];
        switch (tier) {
            case 1: {
                body = polyPts(48, 46);
                ringMetal(ctx, 38, 46, STEEL, t * 0.2);
                enamelCircle(ctx, 38, '#2a3140', '#0e1218');
                gloss(ctx, 38);
                iconBike(ctx, '#d7dde4', t);
                break;
            }
            case 2: {
                body = shieldPts(44, 58);
                facetBody(ctx, body, BRONZE, t, light, 0.9);
                const inner = scalePts(body, 0.78, 1);
                enamelPts(ctx, inner, '#3a2414', '#120a05');
                ctx.save(); tracePts(ctx, inner); ctx.clip();
                ctx.strokeStyle = 'rgba(241,196,140,.35)'; ctx.lineWidth = 1.6;
                ctx.setLineDash([5, 6]); ctx.lineDashOffset = -t * 14;
                ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 60); ctx.stroke();
                ctx.setLineDash([]); ctx.lineDashOffset = 0;
                gloss(ctx, 40);
                ctx.restore();
                iconStroke(ctx, '#f1c48c', 2.4);
                for (const dy of [-29, -24]) { ctx.beginPath(); ctx.moveTo(-8, dy + 3); ctx.lineTo(0, dy - 1); ctx.lineTo(8, dy + 3); ctx.stroke(); }
                ctx.save(); ctx.translate(0, 4); iconTrend(ctx, '#f6d3a3'); ctx.restore();
                break;
            }
            case 3: {
                for (let i = 0; i < 4; i++) {
                    const a = i * Math.PI / 2 - Math.PI / 2;
                    facetBody(ctx, [[66 * Math.cos(a), 66 * Math.sin(a)], [48 * Math.cos(a + 0.2), 48 * Math.sin(a + 0.2)], [40 * Math.cos(a), 40 * Math.sin(a)], [48 * Math.cos(a - 0.2), 48 * Math.sin(a - 0.2)]], SILVER, t, light, 0.8);
                }
                body = polyPts(6, 56);
                facetBody(ctx, body, SILVER, t, light);
                const inner = polyPts(6, 40);
                enamelPts(ctx, inner, '#1b2a4a', '#070c1a');
                ctx.save(); ctx.rotate(t * 0.15);
                ctx.strokeStyle = rgba(blueHi, 0.55); ctx.lineWidth = 0.8; ctx.beginPath();
                for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU, r0 = i % 4 === 0 ? 27 : 30; ctx.moveTo(r0 * Math.cos(a), r0 * Math.sin(a)); ctx.lineTo(33 * Math.cos(a), 33 * Math.sin(a)); }
                ctx.stroke(); ctx.restore();
                gloss(ctx, 34);
                iconCompass(ctx, '#eef3f8', 0.5 * Math.sin(t * 0.9) + 0.15 * Math.sin(t * 2.7), blue);
                break;
            }
            case 4: {
                body = shieldPts(48, 66);
                facetBody(ctx, body, GOLD, t, light);
                const inner = scalePts(body, 0.76, 2);
                enamelPts(ctx, inner, rgba(mix(blue, [0, 0, 0], 0.35), 1), rgba(blueDeep, 1));
                ctx.save(); tracePts(ctx, inner); ctx.clip();
                const at = (u: number): Pt => [-26 + 52 * u + 10 * Math.sin(u * TAU), 34 - 64 * u];
                ctx.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y] = at(i / 40); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
                ctx.setLineDash([3, 4]); ctx.lineDashOffset = -t * 12; ctx.strokeStyle = 'rgba(243,213,114,.55)'; ctx.lineWidth = 1.4; ctx.stroke();
                ctx.setLineDash([]); ctx.lineDashOffset = 0;
                const [wx, wy] = at((t * 0.25) % 1); bloom(ctx, wx, wy, 7, GOLD_C, 0.9);
                gloss(ctx, 44);
                ctx.restore();
                ctx.save(); ctx.translate(0, 2); iconNavigate(ctx, '#fff1c4'); ctx.restore();
                break;
            }
            case 5: {
                body = starPts(8, 66, 50, -Math.PI / 2);
                facetBody(ctx, body, PLATINUM, t, light);
                ringMetal(ctx, 34, 40, PLATINUM, -t * 0.4);
                enamelCircle(ctx, 34, rgba(blue, 1), rgba(blueDeep, 1));
                gloss(ctx, 34);
                ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 33.5, 0, TAU); ctx.clip();
                comet(ctx, 29, t * 1.6, blueHi, 1.6, 2.2);
                ctx.restore();
                iconMedal(ctx, '#ffffff');
                break;
            }
            case 6: {
                const back = starPts(8, 70, 46, -Math.PI / 2 + Math.PI / 8);
                facetBody(ctx, back, GOLD, t, light, 0.8);
                body = starPts(8, 70, 48, -Math.PI / 2);
                facetBody(ctx, body, OBSIDIAN, t, light);
                tracePts(ctx, body); ctx.strokeStyle = 'rgba(243,213,114,.9)'; ctx.lineWidth = 1.1; ctx.stroke();
                ringMetal(ctx, 32, 38, GOLD, t * 0.5);
                enamelCircle(ctx, 32, '#22252c', '#050608');
                gloss(ctx, 32);
                const c = (t % 4.5) / 4.5, needle = c < 0.55 ? Math.sin((c / 0.55) * Math.PI / 2) ** 2 : 1 - ((c - 0.55) / 0.45) ** 0.6;
                ctx.save(); ctx.scale(1.3, 1.3); iconGauge(ctx, '#f3d572', clamp(needle * 1.05), '#ff4d4d'); ctx.restore();
                for (let i = 0; i < 4; i++) {
                    const a = i * Math.PI / 2 - Math.PI / 2;
                    gem(ctx, 58 * Math.cos(a), 58 * Math.sin(a), 3.4, a + Math.PI / 2, '#f2faff', '#9fc4e6', '#5b3d08');
                }
                break;
            }
            default: {
                body = starPts(12, 74, 58, -Math.PI / 2);
                facetBody(ctx, body, WHITE_GOLD, t, light);
                if (ctx.createConicGradient) {
                    const pr = ctx.createConicGradient(-t * 0.4, 0, 0);
                    ['255,80,80', '255,200,60', '90,230,140', '70,170,255', '190,110,255', '255,80,80'].forEach((col, i) => pr.addColorStop(i / 5, `rgba(${col},.2)`));
                    tracePts(ctx, body); ctx.fillStyle = pr; ctx.fill();
                }
                ringMetal(ctx, 40, 47, WHITE_GOLD, t * 0.6);
                enamelCircle(ctx, 40, rgba(blue, 1), rgba(blueDeep, 1));
                ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 39.5, 0, TAU); ctx.clip();
                for (const [x, y, ph] of s.stars) {
                    const tw = 0.3 + 0.7 * Math.max(0, Math.sin(t * 1.7 + ph)) ** 3;
                    ctx.fillStyle = `rgba(255,255,255,${tw})`; ctx.beginPath(); ctx.arc(x, y, 0.6 + tw * 0.6, 0, TAU); ctx.fill();
                }
                ctx.restore();
                gloss(ctx, 40);
                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3 - Math.PI / 2;
                    gem(ctx, 60 * Math.cos(a), 60 * Math.sin(a), 3.4, a + Math.PI / 2, rgba(blueHi, 1), rgba(mix(blue, [0, 0, 0], 0.3), 1), '#8a6417');
                }
                ctx.save(); ctx.scale(1.25, 1.25); iconAward(ctx, '#fff1c4'); ctx.restore();
            }
        }

        // Kademeye göre parlama süpürmesi
        if (tier >= 2) sweep(ctx, body, t, [0, 0, 6, 5, 4.5, 4, 3.6, 3.2][tier], [0, 0, 0.35, 0.45, 0.5, 0.55, 0.5, 0.6][tier]);
        else sweep(ctx, polyPts(48, 46), t, 7, 0.25);

        // Şerit ve Roma rakamı
        const bottom = tier === 2 ? 58 : tier === 4 ? 66 : BODY_R[tier];
        const ribbonStops = [STEEL, STEEL, BRONZE, SILVER, GOLD, PLATINUM, GOLD, WHITE_GOLD][tier];
        const ink = tier === 6 ? '#1a1206' : tier >= 4 ? rgba(blueDeep, 1) : tier === 2 ? '#3a1c06' : '#1b2330';
        ribbon(ctx, bottom + 2, tier >= 6 ? 24 : 19, ROMAN[tier], ribbonStops, ink);

        if (tier === 7) crown(ctx, -BODY_R[7] - 2 + 1.2 * Math.sin(t * 1.6), blue, t);
        if (tier === 6) comet(ctx, 80, t * 1.1, GOLD_C, 1.3, 2.2);
        if (tier === 7) {
            comet(ctx, 84, t * 1.3 + 1, GOLD_C, 1.5, 2.6);
            if (s.shock < 1) {
                const q = s.shock;
                ctx.strokeStyle = rgba(mix(blueHi, GOLD_C, 0.4), (1 - q) * 0.8); ctx.lineWidth = 2.6 * (1 - q) + 0.4;
                ctx.beginPath(); ctx.arc(0, 0, 76 + 46 * (1 - (1 - q) * (1 - q)), 0, TAU); ctx.stroke();
            }
        }
        for (const g of s.glints) {
            const q = Math.sin(Math.PI * (g.age / g.life));
            star(ctx, g.x, g.y, g.size * q, g.age * 1.6, q);
        }
        ctx.restore();
    };
};

const emblemScene = (tier: EmblemTier): FrameDef<EmblemState> => ({
    init: ({ rnd }) => ({
        motes: [], glints: [], acc: 0, nextGlint: 0.6, shock: 9,
        stars: Array.from({ length: 22 }, () => { const a = rnd() * TAU, r = rnd() * 36; return [r * Math.cos(a), r * Math.sin(a), rnd() * TAU] as [number, number, number]; }),
    }),
    step: (s, { dt, rnd }) => {
        const R = BODY_R[tier];
        s.acc += dt * MOTE_RATE[tier];
        while (s.acc >= 1) {
            s.acc -= 1;
            const a = rnd() * TAU, r = R + rnd() * 10, max = 1.3 + rnd() * 1.2;
            s.motes.push({ x: r * Math.cos(a), y: r * Math.sin(a), vx: (rnd() - 0.5) * 12, vy: -10 - rnd() * 24, life: max, max, size: 0.6 + rnd() * 1.1 });
        }
        for (const p of s.motes) { p.x += (p.vx + 5 * Math.sin(p.life * 4)) * dt; p.y += p.vy * dt; p.life -= dt; }
        s.motes = s.motes.filter(p => p.life > 0);
        if (GLINT_EVERY[tier] && (s.nextGlint -= dt) <= 0) {
            s.nextGlint = GLINT_EVERY[tier] * (0.6 + rnd() * 0.8);
            const a = rnd() * TAU, r = R * (0.55 + rnd() * 0.45);
            s.glints.push({ x: r * Math.cos(a), y: r * Math.sin(a), age: 0, life: 0.55 + rnd() * 0.4, size: 5 + rnd() * (tier >= 6 ? 8 : 5) });
        }
        for (const g of s.glints) g.age += dt;
        s.glints = s.glints.filter(g => g.age < g.life);
        if (tier === 7) { s.shock += dt / 0.9; if (s.shock > 5.5) s.shock = 0; }
    },
    draw: (s, { ctx, t, accent }) => drawEmblem(tier, s, t, accent)(ctx),
});

const SCENES = Object.fromEntries(RANK_EMBLEMS.map(e => [e.tier, emblemScene(e.tier)])) as Record<EmblemTier, FrameDef<EmblemState>>;

export const mountRankEmblem = (canvas: HTMLCanvasElement, tier: EmblemTier): (() => void) =>
    mountScene(canvas, SCENES[tier], tier * 7919 + 31);
