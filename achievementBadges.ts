// Başarım rozetleri: profil çerçeveleriyle aynı canvas motorunda çizilen, animasyonlu altıgen rozetler.
// Seviyeler: ELİT (zeytin altını), MİTİK (gül-bordo), kilitli (fırçalanmış gümüş + çevrede ilerleme çizgisi).
// Rozetin yüzünde başarımın konusuna göre bir motif oynar; uygulamanın ikonu DOM'da ortada durur.
// Canlı okunan data-* nitelikleri: data-motif, data-progress (0-100), data-color (#rrggbb), data-burst (kutlama anahtarı).

import { FrameDef, mountScene, RGB, TAU, clamp, lerp, rgba, mix, WHITE, bloom, star } from './premiumFrames';

export type BadgeTier = 'locked' | 'elite' | 'mythic';
export type BadgeMotif = 'night' | 'speed' | 'route' | 'social' | 'trophy' | 'explore' | 'shield' | 'pulse';

interface TierStyle { bezel: string[]; face0: string; face1: string; glow: RGB; spark: RGB }

const TIERS: Record<BadgeTier, TierStyle> = {
    elite: { bezel: ['#3e3a1c', '#a59b5c', '#efe6b4', '#7f7640', '#2e2b14'], face0: '#33362a', face1: '#121310', glow: [214, 190, 120], spark: [240, 222, 160] },
    mythic: { bezel: ['#4a0f22', '#c4607e', '#ffd6e2', '#8f2c48', '#33091a'], face0: '#45142a', face1: '#12040a', glow: [255, 80, 135], spark: [255, 160, 195] },
    locked: { bezel: ['#8b9096', '#d9dde1', '#f6f7f8', '#b2b7bc', '#868b91'], face0: '#c2c6cb', face1: '#8e9399', glow: [180, 185, 190], spark: [255, 255, 255] },
};

// Altıgen ölçüleri (motor birimi: canvas ±130). Uygulamadaki gibi tepe köşesi yukarıda.
const HEX_OUT = 86;
const HEX_IN = 73;
const DEFAULT_PROGRESS: RGB = [18, 128, 92];

const hexVerts = (r: number): [number, number][] =>
    Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 3; return [r * Math.cos(a), r * Math.sin(a)]; });

// Köşeleri yuvarlatılmış altıgen yolu
const hexPath = (ctx: CanvasRenderingContext2D, r: number, round: number) => {
    const v = hexVerts(r);
    ctx.beginPath();
    ctx.moveTo((v[5][0] + v[0][0]) / 2, (v[5][1] + v[0][1]) / 2);
    for (let i = 0; i < 6; i++) {
        const p = v[i], q = v[(i + 1) % 6];
        ctx.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, round);
    }
    ctx.closePath();
};

// Altıgen çevresinde tepe köşesinden saat yönünde f (0-1) kadar ilerlemiş nokta
const hexPoint = (r: number, f: number): [number, number] => {
    const v = hexVerts(r), x = (((f % 1) + 1) % 1) * 6, e = Math.floor(x) % 6, k = x - Math.floor(x);
    const p = v[e], q = v[(e + 1) % 6];
    return [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
};

// Çevrenin f0'dan f1'e kadarlık parçası
const hexArc = (ctx: CanvasRenderingContext2D, r: number, f0: number, f1: number) => {
    ctx.beginPath();
    const steps = Math.max(2, Math.ceil((f1 - f0) * 60));
    for (let i = 0; i <= steps; i++) {
        const [x, y] = hexPoint(r, lerp(f0, f1, i / steps));
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
};

const metalSweep = (ctx: CanvasRenderingContext2D, stops: string[], angle: number, repeat: number): CanvasGradient => {
    const n = stops.length;
    if (!ctx.createConicGradient) {
        const lin = ctx.createLinearGradient(-90, -90, 90, 90);
        stops.forEach((c, i) => lin.addColorStop(i / (n - 1), c));
        return lin;
    }
    const g = ctx.createConicGradient(angle, 0, 0);
    for (let r = 0; r < repeat; r++) for (let i = 0; i < n; i++) g.addColorStop((r + i / n) / repeat, stops[i]);
    g.addColorStop(1, stops[0]);
    return g;
};

const hexToRgb = (hex: string | undefined, fallback: RGB): RGB => {
    const m = hex && /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return fallback;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// --- MOTİFLER: rozet yüzünde, ikonun arkasında oynar ---

interface MotifPoint { x: number; y: number; ph: number; s: number; v: number }

const drawMotif = (ctx: CanvasRenderingContext2D, motif: string, pts: MotifPoint[], t: number, c: RGB, k: number) => {
    switch (motif) {
        case 'night': {
            // Yıldızlar göz kırpar, arada bir kayan yıldız geçer
            bloom(ctx, 0, 0, 46, c, 0.18 * k);
            for (const p of pts) {
                const tw = 0.25 + 0.75 * Math.max(0, Math.sin(t * (1.2 + p.v) + p.ph)) ** 3;
                ctx.fillStyle = rgba(mix(c, WHITE, 0.6), tw * k);
                ctx.beginPath(); ctx.arc(p.x, p.y, 0.5 + p.s * 0.9, 0, TAU); ctx.fill();
                if (tw > 0.85 && p.s > 0.7) star(ctx, p.x, p.y, 4 * tw, 0, 0.8 * tw * k);
            }
            const sh = (t % 5) / 0.9;
            if (sh < 1) {
                const x = lerp(-60, 50, sh), y = lerp(-45, 25, sh);
                const g = ctx.createLinearGradient(x - 26, y - 17, x, y);
                g.addColorStop(0, rgba(WHITE, 0)); g.addColorStop(1, rgba(WHITE, 0.9 * k * (1 - sh)));
                ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(x - 26, y - 17); ctx.lineTo(x, y); ctx.stroke();
            }
            break;
        }
        case 'speed': {
            // Çapraz hız çizgileri soldan akar
            ctx.save();
            ctx.rotate(-0.18);
            ctx.lineCap = 'round';
            pts.slice(0, 18).forEach(p => {
                const q = (t * (0.6 + p.v) + p.ph) % 1;
                const x = 90 - q * 190, len = 14 + p.s * 30, y = p.y * 0.9;
                const g = ctx.createLinearGradient(x, y, x + len, y);
                g.addColorStop(0, rgba(c, 0.75 * k)); g.addColorStop(1, rgba(c, 0));
                ctx.strokeStyle = g; ctx.lineWidth = 0.6 + p.s * 1.2;
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
            });
            ctx.restore();
            break;
        }
        case 'route': {
            // Silik harita ızgarası, akan kesik rota ve üzerinde ilerleyen nokta
            ctx.strokeStyle = rgba(c, 0.08 * k); ctx.lineWidth = 0.5;
            ctx.beginPath();
            for (let g = -70; g <= 70; g += 14) { ctx.moveTo(g, -80); ctx.lineTo(g, 80); ctx.moveTo(-80, g); ctx.lineTo(80, g); }
            ctx.stroke();
            const at = (u: number): [number, number] => [-62 + 124 * u, 44 - 88 * u + 15 * Math.sin(u * TAU * 1.5)];
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) { const [x, y] = at(i / 60); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
            ctx.setLineDash([4, 4]); ctx.lineDashOffset = -t * 18;
            ctx.strokeStyle = rgba(c, 0.5 * k); ctx.lineWidth = 1.6; ctx.stroke();
            ctx.setLineDash([]); ctx.lineDashOffset = 0;
            const u = (t * 0.22) % 1;
            for (let j = 10; j > 0; j--) {
                const [x, y] = at(Math.max(0, u - j * 0.012));
                ctx.fillStyle = rgba(c, (1 - j / 10) * 0.6 * k);
                ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill();
            }
            const [x, y] = at(u);
            bloom(ctx, x, y, 8, c, 0.9 * k);
            break;
        }
        case 'social': {
            // Dönen düğümler, aralarındaki bağlar ve bağlarda gezen sinyaller
            const n = 7, nodes: [number, number][] = [];
            for (let i = 0; i < n; i++) {
                const a = (i / n) * TAU + t * 0.25, r = 46 + 6 * Math.sin(t * 0.9 + i);
                nodes.push([r * Math.cos(a), r * Math.sin(a)]);
            }
            ctx.lineWidth = 0.7;
            for (let i = 0; i < n; i++) {
                for (const j of [(i + 1) % n, (i + 3) % n]) {
                    const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i);
                    ctx.strokeStyle = rgba(c, (0.12 + 0.2 * pulse) * k);
                    ctx.beginPath(); ctx.moveTo(nodes[i][0], nodes[i][1]); ctx.lineTo(nodes[j][0], nodes[j][1]); ctx.stroke();
                    const q = (t * 0.6 + i * 0.3) % 1;
                    bloom(ctx, lerp(nodes[i][0], nodes[j][0], q), lerp(nodes[i][1], nodes[j][1], q), 3, c, 0.7 * k * Math.sin(Math.PI * q));
                }
            }
            for (const [x, y] of nodes) {
                bloom(ctx, x, y, 6, c, 0.5 * k);
                ctx.fillStyle = rgba(mix(c, WHITE, 0.5), k);
                ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
            }
            break;
        }
        case 'trophy': {
            // Merkezden dönen ışık huzmeleri ve parıltılar
            ctx.save();
            ctx.rotate(t * 0.25);
            const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 80);
            g.addColorStop(0, rgba(c, 0.35 * k)); g.addColorStop(1, rgba(c, 0));
            ctx.fillStyle = g;
            for (let i = 0; i < 16; i++) {
                const a = (i / 16) * TAU, hw = 0.07;
                ctx.beginPath(); ctx.moveTo(0, 0);
                ctx.lineTo(90 * Math.cos(a - hw), 90 * Math.sin(a - hw)); ctx.lineTo(90 * Math.cos(a + hw), 90 * Math.sin(a + hw));
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();
            pts.slice(0, 10).forEach(p => {
                const tw = Math.max(0, Math.sin(t * 1.6 + p.ph)) ** 6;
                if (tw > 0.05) star(ctx, p.x, p.y, 5 * tw + 1, t, tw * k);
            });
            break;
        }
        case 'explore': {
            // Pusula çizgileri döner, radar taraması geçer, hedefler belirir
            ctx.save();
            ctx.rotate(-t * 0.15);
            ctx.strokeStyle = rgba(c, 0.4 * k);
            ctx.beginPath();
            for (let i = 0; i < 72; i++) {
                const a = (i / 72) * TAU, r0 = i % 6 === 0 ? 50 : 54;
                ctx.moveTo(r0 * Math.cos(a), r0 * Math.sin(a)); ctx.lineTo(58 * Math.cos(a), 58 * Math.sin(a));
            }
            ctx.lineWidth = 0.6; ctx.stroke();
            ctx.restore();
            if (ctx.createConicGradient) {
                const g = ctx.createConicGradient(t * 1.4, 0, 0);
                g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.86, rgba(c, 0)); g.addColorStop(1, rgba(c, 0.4 * k));
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.fill();
            }
            pts.slice(0, 5).forEach(p => {
                const a = Math.atan2(p.y, p.x), sweep = t * 1.4;
                const since = (((sweep - a) % TAU) + TAU) % TAU;
                const glow = Math.exp(-since * 1.2);
                if (glow > 0.05) bloom(ctx, p.x * 0.8, p.y * 0.8, 5, c, glow * k);
            });
            break;
        }
        case 'shield': {
            // Bal peteği dokusunda dışa yayılan parlaklık dalgası
            const hr = 7.5, w = hr * Math.sqrt(3);
            ctx.lineWidth = 0.6;
            for (let row = -7; row <= 7; row++) {
                for (let col = -6; col <= 6; col++) {
                    const x = col * w + (row % 2 ? w / 2 : 0), y = row * hr * 1.5;
                    const d = Math.hypot(x, y);
                    if (d > 78) continue;
                    const b = (0.5 + 0.5 * Math.sin(d * 0.12 - t * 2.6)) ** 4;
                    ctx.strokeStyle = rgba(c, (0.06 + 0.4 * b) * k);
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const a = (i * Math.PI) / 3 + Math.PI / 6;
                        const px = x + (hr - 0.8) * Math.cos(a), py = y + (hr - 0.8) * Math.sin(a);
                        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
                    }
                    ctx.closePath(); ctx.stroke();
                }
            }
            break;
        }
        default: {
            // Merkezden dışa yayılan altıgen dalgalar
            for (let i = 0; i < 3; i++) {
                const q = (t * 0.55 + i / 3) % 1;
                ctx.strokeStyle = rgba(c, (1 - q) * 0.45 * k); ctx.lineWidth = 1.2;
                hexPath(ctx, 20 + 58 * q, 4); ctx.stroke();
            }
        }
    }
};

// --- ROZET SAHNESİ ---

interface Mote { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number }
interface BadgeState {
    pts: MotifPoint[]; brush: [number, number, number][]; motes: Mote[]; glints: { x: number; y: number; age: number; life: number; size: number }[];
    acc: number; nextGlint: number; lastBurst: string | undefined; burstAge: number;
}

const MOTE_RATE: Record<BadgeTier, number> = { locked: 0, elite: 6, mythic: 14 };
const GLINT_EVERY: Record<BadgeTier, number> = { locked: 0, elite: 1.1, mythic: 0.6 };

const badgeScene = (tier: BadgeTier): FrameDef<BadgeState> => ({
    init: ({ rnd, data }) => ({
        pts: Array.from({ length: 30 }, () => {
            const a = rnd() * TAU, r = 18 + rnd() * 50;
            return { x: r * Math.cos(a), y: r * Math.sin(a), ph: rnd() * TAU, s: rnd(), v: rnd() };
        }),
        brush: Array.from({ length: 70 }, () => [-80 + rnd() * 160, 0.5 + rnd() * 1.2, rnd() < 0.5 ? 1 : 0] as [number, number, number]),
        motes: [], glints: [], acc: 0, nextGlint: 0.8, lastBurst: data.burst, burstAge: 9,
    }),
    step: (s, { dt, rnd, data }) => {
        // Kutlama anahtarı değiştiyse kazanma animasyonunu başlat
        if (data.burst !== s.lastBurst) {
            s.lastBurst = data.burst;
            if (tier !== 'locked') {
                s.burstAge = 0;
                for (let i = 0; i < 64; i++) {
                    const a = rnd() * TAU, v = 60 + rnd() * 120, max = 0.7 + rnd() * 0.8;
                    s.motes.push({ x: 60 * Math.cos(a), y: 60 * Math.sin(a), vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max, size: 0.8 + rnd() * 1.6 });
                }
            }
        }
        s.burstAge += dt;

        s.acc += dt * MOTE_RATE[tier];
        while (s.acc >= 1) {
            s.acc -= 1;
            const [x, y] = hexPoint(HEX_OUT + 2, rnd()), max = 1.4 + rnd() * 1.2;
            s.motes.push({ x, y, vx: (rnd() - 0.5) * 10, vy: -14 - rnd() * (tier === 'mythic' ? 30 : 16), life: max, max, size: 0.6 + rnd() * 1.1 });
        }
        for (const p of s.motes) {
            p.vx *= 1 - 1.2 * dt; p.vy *= 1 - 0.6 * dt;
            p.x += (p.vx + 5 * Math.sin(p.life * 4)) * dt; p.y += p.vy * dt; p.life -= dt;
        }
        s.motes = s.motes.filter(p => p.life > 0);

        if (GLINT_EVERY[tier] && (s.nextGlint -= dt) <= 0) {
            s.nextGlint = GLINT_EVERY[tier] * (0.6 + rnd() * 0.8);
            const [x, y] = hexPoint(rnd() < 0.6 ? HEX_OUT - 1 : 79, Math.floor(rnd() * 6) / 6 + (rnd() < 0.5 ? 0 : 0.03));
            s.glints.push({ x, y, age: 0, life: 0.6 + rnd() * 0.3, size: 6 + rnd() * 6 });
        }
        for (const g of s.glints) g.age += dt;
        s.glints = s.glints.filter(g => g.age < g.life);
    },
    draw: (s, { ctx, t, data }) => {
        const st = TIERS[tier];
        const earned = tier !== 'locked';
        const motif = data.motif || 'pulse';

        // Arka ışık: nefes alan hale; MİTİK'te dönen huzmeler
        if (earned) {
            const pulse = 0.8 + 0.2 * Math.sin(t * 1.6);
            const g = ctx.createRadialGradient(0, 0, 50, 0, 0, 126);
            g.addColorStop(0, rgba(st.glow, 0.5 * pulse)); g.addColorStop(1, rgba(st.glow, 0));
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 126, 0, TAU); ctx.fill();
        }
        if (tier === 'mythic') {
            const g = ctx.createRadialGradient(0, 0, 70, 0, 0, 128);
            g.addColorStop(0, rgba(st.glow, 0.45)); g.addColorStop(1, rgba(st.glow, 0));
            ctx.save();
            ctx.rotate(t * 0.15);
            ctx.fillStyle = g;
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * TAU, hw = i % 2 ? 0.05 : 0.09, R = i % 2 ? 112 : 128;
                ctx.beginPath();
                ctx.moveTo(70 * Math.cos(a - hw * 0.4), 70 * Math.sin(a - hw * 0.4));
                ctx.lineTo(R * Math.cos(a - hw), R * Math.sin(a - hw)); ctx.lineTo(R * Math.cos(a + hw), R * Math.sin(a + hw));
                ctx.lineTo(70 * Math.cos(a + hw * 0.4), 70 * Math.sin(a + hw * 0.4));
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();
        }

        // Yükselen toz / korlar (rozetin arkasında)
        for (const p of s.motes) {
            const k = clamp(p.life / p.max);
            ctx.fillStyle = rgba(mix(st.spark, WHITE, 0.3 * k), Math.min(1, k * 1.5) * 0.9);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * k), 0, TAU); ctx.fill();
        }

        // Gölge, metal çerçeve ve fasetler
        ctx.save(); ctx.translate(0, 5);
        hexPath(ctx, HEX_OUT, 10); ctx.fillStyle = earned ? 'rgba(0,0,0,.28)' : 'rgba(0,0,0,.14)'; ctx.fill();
        ctx.restore();
        hexPath(ctx, HEX_OUT, 10); ctx.fillStyle = metalSweep(ctx, st.bezel, t * (earned ? 0.25 : 0.08), 2); ctx.fill();
        ctx.save();
        hexPath(ctx, HEX_OUT, 10); ctx.clip();
        const vo = hexVerts(HEX_OUT + 4), vi = hexVerts(HEX_IN);
        for (let i = 0; i < 6; i++) {
            const j = (i + 1) % 6, normal = -Math.PI / 2 + (i + 0.5) * (Math.PI / 3);
            const shade = Math.cos(normal - (-3 * Math.PI) / 4);
            ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${0.3 * shade})` : `rgba(0,0,0,${0.34 * -shade})`;
            ctx.beginPath(); ctx.moveTo(vo[i][0], vo[i][1]); ctx.lineTo(vo[j][0], vo[j][1]); ctx.lineTo(vi[j][0], vi[j][1]); ctx.lineTo(vi[i][0], vi[i][1]); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        hexPath(ctx, HEX_OUT - 1, 9.5); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 0.9; ctx.stroke();
        hexPath(ctx, HEX_IN + 1, 7); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2; ctx.stroke();

        // Yüz: koyu mine (kilitlide fırçalanmış gümüş)
        const face = ctx.createRadialGradient(-22, -28, 4, 0, 0, 100);
        face.addColorStop(0, st.face0); face.addColorStop(1, st.face1);
        hexPath(ctx, HEX_IN, 7); ctx.fillStyle = face; ctx.fill();
        ctx.save();
        hexPath(ctx, HEX_IN - 0.5, 6.5); ctx.clip();
        if (earned) {
            drawMotif(ctx, motif, s.pts, t, st.spark, 1);
        } else {
            for (const [y, w, light] of s.brush) {
                ctx.fillStyle = light ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.07)';
                ctx.fillRect(-80, y, 160, w * 0.5);
            }
            // Kazanılınca oynayacak motifin gümüşe kazınmış gibi koyu, renksiz önizlemesi
            drawMotif(ctx, motif, s.pts, t * 0.6, [52, 60, 72], 0.75);
        }
        ctx.restore();

        // Kenarda dolaşan ışık: ELİT'te bir altın parıltı, MİTİK'te iki enerji darbesi
        if (earned) {
            const pulses = tier === 'mythic' ? [t * 0.32, t * 0.32 + 0.5] : [t * 0.18];
            ctx.lineCap = 'round';
            for (const f of pulses) {
                for (let j = 0; j < 12; j++) {
                    const f0 = f - j * 0.008, k = 1 - j / 12;
                    hexArc(ctx, HEX_IN + 0.5, f0 - 0.009, f0);
                    ctx.strokeStyle = rgba(mix(st.spark, WHITE, 0.4 * k), k * 0.95); ctx.lineWidth = 1.8 * k + 0.4; ctx.stroke();
                }
                const [x, y] = hexPoint(HEX_IN + 0.5, f);
                bloom(ctx, x, y, 7, st.spark, 0.9);
            }
        }

        // Köşeler: ELİT'te pirinç perçinler, MİTİK'te yakutlar
        if (earned) {
            for (const [x0, y0] of hexVerts(79.5)) {
                if (tier === 'elite') {
                    const g = ctx.createRadialGradient(x0 - 0.8, y0 - 0.8, 0.2, x0, y0, 2.8);
                    g.addColorStop(0, '#fff6d2'); g.addColorStop(0.5, '#b7aa62'); g.addColorStop(1, '#4a4420');
                    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x0, y0, 2.6, 0, TAU); ctx.fill();
                } else {
                    ctx.save(); ctx.translate(x0, y0);
                    ctx.fillStyle = '#5a1528'; ctx.beginPath(); ctx.moveTo(0, -3.6); ctx.lineTo(3.6, 0); ctx.lineTo(0, 3.6); ctx.lineTo(-3.6, 0); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = '#ff5f8f'; ctx.beginPath(); ctx.moveTo(0, -2.6); ctx.lineTo(2.6, 0); ctx.lineTo(0, 2.6); ctx.lineTo(-2.6, 0); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.moveTo(-1.3, -0.3); ctx.lineTo(0, -1.9); ctx.lineTo(0.4, -0.3); ctx.closePath(); ctx.fill();
                    ctx.restore();
                }
            }
        }

        // Kilitli: çevrede ilerleme oluğu ve uygulamanın yeşilinde ilerleme çizgisi
        if (!earned) {
            const p = clamp(Number(data.progress) / 100 || 0);
            const col = hexToRgb(data.color, DEFAULT_PROGRESS);
            hexPath(ctx, 79.5, 8.5); ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 3.4; ctx.stroke();
            if (p > 0) {
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                hexArc(ctx, 79.5, 0, p); ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 3.4; ctx.stroke();
                hexArc(ctx, 79.5, 0, p); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.8; ctx.stroke();
                // İlerleme çizgisinin içinde akan ışık
                hexArc(ctx, 79.5, 0, p);
                ctx.setLineDash([2.5, 9]); ctx.lineDashOffset = -t * 16;
                ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.6; ctx.stroke();
                ctx.setLineDash([]); ctx.lineDashOffset = 0;
                const [x, y] = hexPoint(79.5, p);
                bloom(ctx, x, y, 8 + 2 * Math.sin(t * 3), col, 0.8);
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 1.4, 0, TAU); ctx.fill();
            }
        }

        // Çapraz parlama süpürmesi
        const cycle = earned ? 4.2 : 6.5, q = (t % cycle) / 1.3;
        if (q < 1) {
            ctx.save();
            hexPath(ctx, HEX_OUT, 10); ctx.clip();
            ctx.rotate(-Math.PI / 4);
            const x = lerp(-130, 130, q);
            const g = ctx.createLinearGradient(x - 18, 0, x + 18, 0);
            g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${earned ? 0.42 : 0.3})`); g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g; ctx.fillRect(x - 18, -140, 36, 280);
            ctx.restore();
        }

        // Parıltılar
        for (const g of s.glints) {
            const k = Math.sin(Math.PI * (g.age / g.life));
            star(ctx, g.x, g.y, g.size * k, g.age * 1.5, k);
        }

        // Kazanma anı: altıgen şok dalgaları ve parlama
        if (s.burstAge < 1.6) {
            const flash = Math.max(0, 1 - s.burstAge / 0.5);
            if (flash > 0) bloom(ctx, 0, 0, 90 + 30 * (1 - flash), mix(st.spark, WHITE, 0.5), 0.8 * flash);
            for (const delay of [0, 0.25]) {
                const q2 = (s.burstAge - delay) / 1.1;
                if (q2 <= 0 || q2 >= 1) continue;
                hexPath(ctx, HEX_OUT + 42 * (1 - (1 - q2) ** 2), 12);
                ctx.strokeStyle = rgba(mix(st.spark, WHITE, 0.4), (1 - q2) * 0.9); ctx.lineWidth = 3 * (1 - q2) + 0.5; ctx.stroke();
            }
        }
    },
});

const SCENES: Record<BadgeTier, FrameDef<BadgeState>> = {
    locked: badgeScene('locked'),
    elite: badgeScene('elite'),
    mythic: badgeScene('mythic'),
};

export const mountBadge = (canvas: HTMLCanvasElement, tier: BadgeTier): (() => void) =>
    mountScene(canvas, SCENES[tier], tier.length * 977 + Math.floor(Math.random() * 1000));

// Uygulamadaki başarımlar için önerilen motifler
export const ACHIEVEMENT_MOTIFS: Record<string, BadgeMotif> = {
    'Gece Devriyesi': 'night',
    'Karanlık Sürücüsü': 'night',
    'Konvoy Lideri': 'social',
    'Kardeşlik Bağı': 'social',
    'Topluluk İkonu': 'social',
    'Etkinlik Mimarı': 'trophy',
    'Büyük Organizatör': 'trophy',
    'Rota Kâşifi': 'route',
    'Rota Üstadı': 'route',
    'Mesafe Avcısı': 'route',
    'Kıtalararası Gezgin': 'explore',
    'Apex Virtüözü': 'explore',
    'Pist Sürati': 'speed',
    'Süper Spor Uzmanı': 'speed',
    'Apex Koleksiyoneri': 'trophy',
};

