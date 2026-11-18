// Ultra premium profil çerçeveleri için canvas tabanlı hareket motoru.
// React'ten bağımsızdır: mountPremiumFrame(canvas, id) çağrılır, dönen fonksiyon temizler.
// Koordinat sistemi SVG çerçevelerle aynıdır: merkez (0,0), avatar yarıçapı 71, çerçeve bandı 72..100.
// Canvas, çerçeve kutusunun %130'unu kaplar; 100..130 arası parlama ve parçacık taşması içindir.

export type PremiumFrameId =
    | 'apex' | 'redline' | 'wind-tunnel' | 'night-road' | 'volt' | 'gold'
    | 'sparks' | 'hud' | 'pulse' | 'kustom' | 'podium' | 'telemetry'
    | 'rank-rookie' | 'rank-street' | 'rank-explorer' | 'rank-commander' | 'rank-master' | 'rank-elite' | 'rank-legend'
    | 'convoy' | 'storyteller' | 'kilometre' | 'founder';

export const PREMIUM_FRAME_IDS: PremiumFrameId[] = [
    'apex', 'redline', 'wind-tunnel', 'night-road', 'volt', 'gold',
    'sparks', 'hud', 'pulse', 'kustom', 'podium', 'telemetry',
    'rank-rookie', 'rank-street', 'rank-explorer', 'rank-commander', 'rank-master', 'rank-elite', 'rank-legend',
    'convoy', 'storyteller', 'kilometre', 'founder',
];

export type RGB = [number, number, number];

export interface Env {
    ctx: CanvasRenderingContext2D;
    t: number;
    dt: number;
    accent: RGB;
    rnd: () => number;
    level: number; // canvas'ın data-level niteliği; ilerleme gösteren çerçeveler kullanır (ör. katılan arkadaş sayısı)
    data: DOMStringMap; // canvas'ın data-* nitelikleri, canlı okunur (ör. rozet motifi, ilerleme, kutlama anahtarı)
}

export interface FrameDef<S> {
    init: (env: Env) => S;
    step: (s: S, env: Env) => void;
    draw: (s: S, env: Env) => void;
}

// --- HELPERS ---

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a)})`;
export const mix = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

export const WHITE: RGB = [255, 255, 255];
const RED: RGB = [255, 59, 48];

export const mulberry32 = (seed: number) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};

const annulus = (ctx: CanvasRenderingContext2D, r0: number, r1: number) => {
    ctx.beginPath();
    ctx.arc(0, 0, r1, 0, TAU);
    ctx.arc(0, 0, r0, 0, TAU, true);
};

// Koyu "cam" zemin: ışıklı efektlerin açık temada da okunmasını sağlar
const substrate = (ctx: CanvasRenderingContext2D, inner: string, mid: string, outer: string) => {
    const g = ctx.createRadialGradient(0, 0, 72, 0, 0, 101);
    g.addColorStop(0, inner);
    g.addColorStop(0.5, mid);
    g.addColorStop(1, outer);
    annulus(ctx, 71.5, 101);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.beginPath(); ctx.arc(0, 0, 72.4, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath(); ctx.arc(0, 0, 100.4, 0, TAU); ctx.stroke();
};

export const bloom = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: RGB, a: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(mix(c, WHITE, 0.7), a));
    g.addColorStop(0.35, rgba(c, a * 0.55));
    g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
};

// ============================================================================
// 1) APEX — gece virajında uzun pozlama: stop ve far ışıkları eğik yörüngelerde iz bırakır
// ============================================================================

interface Comet { a: number; b: number; rot: number; prec: number; th: number; speed: number; color: RGB | 'accent'; len: number; w: number }

const apex: FrameDef<{ comets: Comet[] }> = {
    init: () => ({
        comets: [
            { a: 96, b: 80, rot: 20 * DEG, prec: 4 * DEG, th: 0, speed: 2.3, color: [255, 40, 40], len: 2.6, w: 3.4 },
            { a: 96, b: 80, rot: 20 * DEG, prec: 4 * DEG, th: Math.PI, speed: 2.3, color: [255, 40, 40], len: 1.8, w: 2.6 },
            { a: 95, b: 79, rot: 140 * DEG, prec: -3 * DEG, th: 1, speed: -3.1, color: [255, 240, 205], len: 3.1, w: 3.2 },
            { a: 93, b: 82, rot: 260 * DEG, prec: 5 * DEG, th: 4, speed: 1.7, color: 'accent', len: 2.4, w: 3.6 },
        ],
    }),
    step: (s, { dt }) => {
        // Yakın tarafta (alt yarı) hızlanır: derinlik hissi
        for (const c of s.comets) c.th += c.speed * (1 + 0.35 * Math.sin(c.th)) * dt;
    },
    draw: (s, { ctx, t, accent }) => {
        substrate(ctx, '#1b1d24', '#08090c', '#16181e');
        ctx.save();
        annulus(ctx, 72, 100.5);
        ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        const N = 44;
        for (const c of s.comets) {
            const col = c.color === 'accent' ? accent : c.color;
            const rot = c.rot + c.prec * t;
            const cr = Math.cos(rot), sr = Math.sin(rot);
            const pt = (th: number): [number, number] => {
                const x = c.a * Math.cos(th), y = c.b * Math.sin(th);
                return [x * cr - y * sr, x * sr + y * cr];
            };
            // Yörüngenin soluk hayaleti
            ctx.strokeStyle = rgba(col, 0.16);
            ctx.lineWidth = 0.9;
            ctx.beginPath(); ctx.ellipse(0, 0, c.a, c.b, rot, 0, TAU); ctx.stroke();

            const dir = Math.sign(c.speed);
            let [px, py] = pt(c.th);
            for (let i = 1; i <= N; i++) {
                const k = i / N;
                const th = c.th - dir * c.len * k;
                const [x, y] = pt(th);
                const depth = 0.65 + 0.35 * Math.sin(th);
                const fade = (1 - k) * (1 - k);
                ctx.strokeStyle = rgba(col, fade * 0.16);
                ctx.lineWidth = c.w * 3.6 * depth * (1 - k * 0.6);
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
                ctx.strokeStyle = rgba(mix(col, WHITE, 0.35 * (1 - k)), fade);
                ctx.lineWidth = c.w * depth * (1 - k * 0.75);
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
                px = x; py = y;
            }
            const [hx, hy] = pt(c.th);
            bloom(ctx, hx, hy, 9 * (0.7 + 0.3 * Math.sin(c.th)), col, 0.95);
        }
        ctx.restore();
    },
};

// ============================================================================
// 2) REDLINE — 1'den 6'ya vites büyüten devir göstergesi: şok dalgası, tepe iğnesi, kesici kıvılcımı
// ============================================================================

interface RedlineState {
    gear: number; rpm: number; phase: 'idle' | 'up' | 'limiter' | 'down'; timer: number; peak: number; flash: number;
    shocks: { age: number; strong: boolean }[];
    sparks: { x: number; y: number; vx: number; vy: number; life: number }[];
}

const UP_RATE = [0.95, 0.72, 0.56, 0.46, 0.39, 0.33];

const redline: FrameDef<RedlineState> = {
    init: () => ({ gear: 0, rpm: 0.24, phase: 'idle', timer: 0.6, peak: 0, flash: 0, shocks: [], sparks: [] }),
    step: (s, { dt, t, rnd }) => {
        if (s.phase === 'idle') {
            s.rpm = lerp(s.rpm, 0.24 + 0.015 * Math.sin(t * 9), 0.2);
            if ((s.timer -= dt) <= 0) { s.phase = 'up'; s.gear = 1; }
        } else if (s.phase === 'up') {
            s.rpm += UP_RATE[s.gear - 1] * dt;
            if (s.rpm >= 0.97) {
                if (s.gear < 6) {
                    s.gear++; s.rpm = 0.56 + 0.03 * s.gear; s.flash = 1;
                    s.shocks.push({ age: 0, strong: true });
                } else { s.phase = 'limiter'; s.timer = 1.5; }
            }
        } else if (s.phase === 'limiter') {
            s.rpm = 0.955 + 0.04 * Math.abs(Math.sin(t * 38));
            for (let i = 0; i < 2; i++) {
                const a = 45 * DEG + (rnd() - 0.5) * 0.3, v = 60 + rnd() * 80;
                s.sparks.push({ x: 99 * Math.cos(a), y: 99 * Math.sin(a), vx: v * Math.cos(a - 0.9), vy: v * Math.sin(a - 0.9), life: 0.25 + rnd() * 0.3 });
            }
            if ((s.timer -= dt) <= 0) s.phase = 'down';
        } else {
            s.rpm -= 0.55 * dt;
            if (s.rpm < 0.42 && s.gear > 1) { s.gear--; s.rpm = 0.63; s.shocks.push({ age: 0, strong: false }); }
            if (s.gear === 1 && s.rpm < 0.3) { s.phase = 'idle'; s.gear = 0; s.timer = 1.3; }
        }
        s.peak = Math.max(s.peak - 0.14 * dt, s.rpm);
        s.flash = Math.max(0, s.flash - dt * 3.2);
        for (const k of s.shocks) k.age += dt;
        s.shocks = s.shocks.filter(k => k.age < 0.7);
        for (const p of s.sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.life -= dt; }
        s.sparks = s.sparks.filter(p => p.life > 0);
    },
    draw: (s, { ctx, t, accent }) => {
        const limiter = s.phase === 'limiter';
        substrate(ctx, '#17181d', '#07080a', '#131419');
        if (limiter) { annulus(ctx, 72, 100.5); ctx.fillStyle = rgba(RED, 0.1 + 0.1 * Math.abs(Math.sin(t * 38))); ctx.fill(); }

        const NB = 54, A0 = 135 * DEG, SW = 270 * DEG;
        ctx.lineCap = 'round';
        for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < NB; i++) {
                const f = (i + 0.5) / NB;
                const lit = f <= s.rpm;
                if (pass === 0 && !lit) continue;
                const a = A0 + SW * f;
                const len = lit ? 8 + 10 * f + 2.4 * s.rpm * Math.sin(t * 31 + i * 1.7) : 3.5;
                let col: RGB = f > 0.83 ? RED : mix(accent, WHITE, 0.25 * f);
                col = mix(col, WHITE, s.flash * 0.8);
                const ca = Math.cos(a), sa = Math.sin(a);
                ctx.strokeStyle = !lit ? (f > 0.83 ? 'rgba(255,59,48,.3)' : 'rgba(255,255,255,.13)') : rgba(col, pass === 0 ? 0.22 : 1);
                ctx.lineWidth = pass === 0 ? 7 : 2.8;
                ctx.beginPath(); ctx.moveTo(77 * ca, 77 * sa); ctx.lineTo((77 + len) * ca, (77 + len) * sa); ctx.stroke();
            }
        }
        // Tepe iğnesi: ulaşılan en yüksek devirde asılı kalır, yavaşça düşer
        const pa = A0 + SW * clamp(s.peak);
        ctx.strokeStyle = 'rgba(255,255,255,.95)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(76 * Math.cos(pa), 76 * Math.sin(pa)); ctx.lineTo(99 * Math.cos(pa), 99 * Math.sin(pa)); ctx.stroke();

        // Vites göstergesi
        const pop = 1 + s.flash * 0.35;
        ctx.fillStyle = '#050608';
        ctx.strokeStyle = limiter ? rgba(RED, 0.9) : 'rgba(255,255,255,.22)';
        ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.roundRect(-12, 78, 24, 18, 5); ctx.fill(); ctx.stroke();
        ctx.save();
        ctx.translate(0, 87.5); ctx.scale(pop, pop);
        ctx.font = 'italic 900 14px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = s.gear === 0 ? '#22c55e' : limiter ? rgba(RED, 1) : '#fff';
        ctx.fillText(s.gear === 0 ? 'N' : String(s.gear), 0, 0.5);
        ctx.restore();

        // Vites şok dalgaları ve kesici kıvılcımları (çerçevenin dışına taşar)
        for (const k of s.shocks) {
            const q = k.age / 0.7;
            ctx.strokeStyle = rgba(accent, (1 - q) * (k.strong ? 0.7 : 0.3));
            ctx.lineWidth = (k.strong ? 2.6 : 1.4) * (1 - q) + 0.4;
            ctx.beginPath(); ctx.arc(0, 0, 100 + 27 * (1 - (1 - q) * (1 - q)), 0, TAU); ctx.stroke();
        }
        ctx.lineWidth = 1.1;
        for (const p of s.sparks) {
            ctx.strokeStyle = rgba([255, 170, 40], clamp(p.life * 4));
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke();
        }
    },
};

// ============================================================================
// 3) RÜZGAR TÜNELİ — avatarın etrafından akan hava: silindir çevresinde potansiyel akış,
//    hıza göre renklenen akım çizgileri ve yüzeyde basınç haritası
// ============================================================================

const TRAIL = 44;
interface Streak { x: number; y: number; seed: number; n: number; head: number; px: Float32Array; py: Float32Array; ps: Float32Array }

const FLOW_R = 76, FLOW_U = 62;
const COOL: RGB = [86, 124, 170];

const flow = (x: number, y: number, t: number, seed: number): [number, number] => {
    const r2 = Math.max(x * x + y * y, FLOW_R * FLOW_R * 0.9);
    const k = (FLOW_R * FLOW_R) / (r2 * r2);
    let u = FLOW_U * (1 - k * (x * x - y * y));
    let v = -FLOW_U * 2 * k * x * y;
    if (x > 0) {
        // Arkadaki iz bölgesi: akış yavaşlar ve çalkalanır
        const wake = Math.exp(-(y / 38) * (y / 38)) * Math.min(1, x / 60);
        u *= 1 - 0.4 * wake;
        v += wake * 20 * Math.sin(t * 5 + x * 0.09 + seed * 9);
    }
    return [u, v];
};

const speedColor = (sp: number, accent: RGB): RGB => sp < 1 ? mix(COOL, accent, clamp((sp - 0.45) / 0.55)) : mix(accent, RED, clamp((sp - 1.25) / 0.6));

const windTunnel: FrameDef<{ streaks: Streak[] }> = {
    init: ({ rnd }) => ({
        streaks: Array.from({ length: 90 }, () => ({
            x: -128 + rnd() * 256, y: (rnd() - 0.5) * 236, seed: rnd(), n: 0, head: 0,
            px: new Float32Array(TRAIL), py: new Float32Array(TRAIL), ps: new Float32Array(TRAIL),
        })),
    }),
    step: (s, { dt, t, rnd }) => {
        for (const p of s.streaks) {
            const r = Math.hypot(p.x, p.y);
            if (p.x > 130 || r > 134 || r < FLOW_R - 1) { p.x = -128; p.y = (rnd() - 0.5) * 236; p.n = 0; }
            const [u, v] = flow(p.x, p.y, t, p.seed);
            p.x += u * dt; p.y += v * dt;
            p.head = (p.head + 1) % TRAIL;
            p.px[p.head] = p.x; p.py[p.head] = p.y; p.ps[p.head] = Math.hypot(u, v) / FLOW_U;
            if (p.n < TRAIL) p.n++;
        }
    },
    draw: (s, { ctx, t, accent }) => {
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.5;
        for (const p of s.streaks) {
            for (let j = 0; j < p.n - 1; j++) {
                const i0 = (p.head - j + TRAIL) % TRAIL, i1 = (p.head - j - 1 + TRAIL) % TRAIL;
                const x = p.px[i0], y = p.py[i0];
                const edge = clamp((128 - Math.hypot(x, y)) / 30);
                ctx.strokeStyle = rgba(speedColor(p.ps[i0], accent), (1 - j / p.n) * edge * 0.9);
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(p.px[i1], p.py[i1]); ctx.stroke();
            }
        }
        // Yüzey basınç haritası: önde durma noktası sıcak, omuzlarda hızlanan akış soğuk
        ctx.lineCap = 'butt';
        ctx.lineWidth = 4;
        const SEG = 72;
        for (let i = 0; i < SEG; i++) {
            const a0 = (i / SEG) * TAU, a1 = ((i + 1.15) / SEG) * TAU;
            const sn = Math.sin(a0 + TAU / SEG / 2);
            const pulse = 0.06 * Math.sin(t * 3 - Math.abs(sn) * 5);
            ctx.strokeStyle = rgba(speedColor(2 * Math.abs(sn) + pulse, accent), 1);
            ctx.beginPath(); ctx.arc(0, 0, 73.6, a0, a1); ctx.stroke();
        }
        bloom(ctx, -FLOW_R - 1, 0, 11, RED, 0.5 + 0.15 * Math.sin(t * 4));
    },
};

// ============================================================================
// 4) GECE YOLU — avatarı saran asfalt: far huzmesi şerit çizgilerini ve kedi gözlerini aydınlatır,
//    karşıdan gelen motorla selamlaşma anında parlar
// ============================================================================

const angAhead = (target: number, src: number, dir: number) => (((target - src) * dir) % TAU + TAU) % TAU;
const beam = (d: number) => d < 2.2 ? Math.exp(-d / 0.75) * clamp(d / 0.05) : 0;

const nightRoad: FrameDef<{ bike: number; onc: number }> = {
    init: () => ({ bike: -1.2, onc: 2.2 }),
    step: (s, { dt }) => { s.bike += 0.95 * dt; s.onc -= 0.62 * dt; },
    draw: (s, { ctx, accent }) => {
        annulus(ctx, 71.5, 101);
        const g = ctx.createRadialGradient(0, 0, 72, 0, 0, 101);
        g.addColorStop(0, '#1d1e23'); g.addColorStop(0.5, '#121317'); g.addColorStop(1, '#1a1b20');
        ctx.fillStyle = g; ctx.fill();

        const lit = (a: number) => clamp(beam(angAhead(a, s.bike, 1)) + 0.8 * beam(angAhead(a, s.onc, -1)));
        const SEG = 120, da = TAU / SEG;
        ctx.lineCap = 'butt';
        for (let k = 0; k < SEG; k++) {
            const a = k * da, I = lit(a + da / 2);
            if (I > 0.02) {
                ctx.fillStyle = `rgba(255,240,200,${I * 0.38})`;
                ctx.beginPath(); ctx.arc(0, 0, 100, a, a + da); ctx.arc(0, 0, 73, a + da, a, true); ctx.fill();
            }
            ctx.lineWidth = 0.9;
            ctx.strokeStyle = `rgba(255,255,255,${0.2 + I * 0.75})`;
            ctx.beginPath(); ctx.arc(0, 0, 75.5, a, a + da * 1.1); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 98.5, a, a + da * 1.1); ctx.stroke();
            if (k % 4 < 2) {
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = rgba(mix(accent, WHITE, I * 0.5), 0.32 + I * 0.68);
                ctx.beginPath(); ctx.arc(0, 0, 87, a, a + da * 1.02); ctx.stroke();
            }
        }
        // Kedi gözleri
        for (let i = 0; i < 24; i++) {
            for (const [r, off] of [[98.5, 0], [75.5, 0.5]] as const) {
                const a = ((i + off) / 24) * TAU, I = lit(a);
                const x = r * Math.cos(a), y = r * Math.sin(a);
                if (I > 0.35) bloom(ctx, x, y, 4.5, [255, 214, 140], I * 0.8);
                ctx.fillStyle = `rgba(255,224,160,${0.18 + I})`;
                ctx.beginPath(); ctx.arc(x, y, 0.8 + I * 0.9, 0, TAU); ctx.fill();
            }
        }
        // Motorlar: stop lambası izi, gövde, far
        const pass = clamp(1 - Math.abs(Math.atan2(Math.sin(s.bike - s.onc), Math.cos(s.bike - s.onc))) / 0.22);
        const rider = (ang: number, r: number, dir: number, head: RGB) => {
            ctx.lineCap = 'round';
            for (let i = 0; i < 14; i++) {
                const a0 = ang - dir * (0.07 + i * 0.03), a1 = a0 - dir * 0.034;
                ctx.strokeStyle = `rgba(255,30,30,${(1 - i / 14) * 0.85})`;
                ctx.lineWidth = 2 * (1 - i / 18);
                ctx.beginPath(); ctx.arc(0, 0, r, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
            }
            ctx.save();
            ctx.rotate(ang); ctx.translate(r, 0);
            ctx.fillStyle = '#000'; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.roundRect(-1.5, -3.6, 3, 7.2, 1.5); ctx.fill(); ctx.stroke();
            ctx.restore();
            const hx = r * Math.cos(ang + dir * 0.045), hy = r * Math.sin(ang + dir * 0.045);
            ctx.globalCompositeOperation = 'lighter';
            bloom(ctx, hx, hy, 8 + pass * 9, head, 0.95);
            ctx.globalCompositeOperation = 'source-over';
        };
        ctx.save();
        annulus(ctx, 72, 100.5); ctx.clip();
        rider(s.onc, 81.5, -1, [214, 232, 255]);
        rider(s.bike, 92.5, 1, [255, 240, 205]);
        ctx.restore();
    },
};

// ============================================================================
// 5) VOLT — şarj dolar, terminaller arasında ark atlar, dolunca tam boşalma ve korona
// ============================================================================

interface Arc { i: number; life: number; max: number }
const CYAN: RGB = [90, 225, 255];
const TERMINALS = 8;
const termAngle = (i: number) => ((i + 0.5) / TERMINALS) * TAU - Math.PI / 2;

const volt: FrameDef<{ charge: number; burst: number; arcs: Arc[]; shock: number }> = {
    init: () => ({ charge: 0.15, burst: 0, arcs: [], shock: 9 }),
    step: (s, { dt, rnd }) => {
        if (s.burst > 0) {
            s.burst -= dt;
            s.charge = Math.max(0, s.charge - dt * 1.3);
            if (s.arcs.length < 10) s.arcs.push({ i: (rnd() * TERMINALS) | 0, life: 0.16, max: 0.16 });
        } else {
            s.charge += dt / 3.4;
            if (rnd() < (0.4 + 5.5 * s.charge * s.charge) * dt) {
                const max = 0.18 + rnd() * 0.3;
                s.arcs.push({ i: (rnd() * TERMINALS) | 0, life: max, max });
            }
            if (s.charge >= 1) { s.charge = 1; s.burst = 0.95; s.shock = 0; }
        }
        s.shock += dt;
        for (const a of s.arcs) a.life -= dt;
        s.arcs = s.arcs.filter(a => a.life > 0);
    },
    draw: (s, { ctx, t, accent, rnd }) => {
        substrate(ctx, '#131a26', '#070a10', '#101623');
        const bursting = s.burst > 0;
        if (bursting) { annulus(ctx, 72, 100.5); ctx.fillStyle = rgba(CYAN, 0.16 * clamp(s.burst / 0.95) * (0.6 + 0.4 * rnd())); ctx.fill(); }

        // Şarj halkası ve ölçek çizgileri
        ctx.lineCap = 'butt';
        ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 96.5, 0, TAU); ctx.stroke();
        ctx.strokeStyle = rgba(bursting ? mix(accent, CYAN, 0.6) : accent, 1); ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, 96.5, -Math.PI / 2, -Math.PI / 2 + TAU * s.charge); ctx.stroke();
        ctx.strokeStyle = '#070a10'; ctx.lineWidth = 0.9;
        for (let i = 0; i < 40; i++) {
            const a = (i / 40) * TAU;
            ctx.beginPath(); ctx.moveTo(95 * Math.cos(a), 95 * Math.sin(a)); ctx.lineTo(98 * Math.cos(a), 98 * Math.sin(a)); ctx.stroke();
        }
        ctx.strokeStyle = rgba(CYAN, 0.12); ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(0, 0, 85, 0, TAU); ctx.stroke();

        // Arklar: her karede yeniden üretilir, titreşir
        const hot = new Set<number>();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const bolt = (pts: [number, number][], k: number) => {
            for (const [w, c, a] of [[5.5, CYAN, 0.2], [2.3, mix(CYAN, WHITE, 0.3), 0.6], [0.9, WHITE, 1]] as [number, RGB, number][]) {
                ctx.strokeStyle = rgba(c, a * k); ctx.lineWidth = w;
                ctx.beginPath(); pts.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
            }
        };
        ctx.globalCompositeOperation = 'lighter';
        for (const arc of s.arcs) {
            const a0 = termAngle(arc.i), a1 = termAngle(arc.i + 1);
            hot.add(arc.i % TERMINALS); hot.add((arc.i + 1) % TERMINALS);
            const n = 13, pts: [number, number][] = [];
            for (let j = 0; j <= n; j++) {
                const q = j / n, env = Math.sin(Math.PI * q);
                const a = lerp(a0, a1, q) + (rnd() - 0.5) * 0.05 * env;
                const r = 85 + (rnd() - 0.5) * 15 * env;
                pts.push([r * Math.cos(a), r * Math.sin(a)]);
            }
            bolt(pts, clamp(arc.life / arc.max * 1.6));
        }
        ctx.globalCompositeOperation = 'source-over';

        // Tam boşalmada dışarı doğru korona dalları ve şok halkası
        if (bursting) {
            ctx.lineWidth = 1.1;
            for (let i = 0; i < TERMINALS; i++) {
                if (rnd() < 0.45) continue;
                let a = termAngle(i) + (rnd() - 0.5) * 0.3, r = 100;
                ctx.strokeStyle = rgba([0, 170, 240], 0.85 * clamp(s.burst / 0.5));
                ctx.beginPath(); ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
                for (let j = 0; j < 5; j++) { r += 3 + rnd() * 4; a += (rnd() - 0.5) * 0.12; ctx.lineTo(r * Math.cos(a), r * Math.sin(a)); }
                ctx.stroke();
            }
        }
        if (s.shock < 0.6) {
            const q = s.shock / 0.6;
            ctx.strokeStyle = rgba([0, 170, 240], (1 - q) * 0.7); ctx.lineWidth = 2.4 * (1 - q) + 0.4;
            ctx.beginPath(); ctx.arc(0, 0, 100 + 26 * (1 - (1 - q) * (1 - q)), 0, TAU); ctx.stroke();
        }
        // Terminaller
        for (let i = 0; i < TERMINALS; i++) {
            const a = termAngle(i), on = hot.has(i);
            ctx.save();
            ctx.rotate(a); ctx.translate(85, 0); ctx.rotate(Math.PI / 4);
            ctx.fillStyle = on ? '#fff' : '#94a3b8';
            ctx.beginPath(); ctx.roundRect(-2.6, -2.6, 5.2, 5.2, 1.2); ctx.fill();
            ctx.fillStyle = on ? rgba(CYAN, 1) : '#1e293b';
            ctx.beginPath(); ctx.arc(0, 0, 1.1, 0, TAU); ctx.fill();
            ctx.restore();
            if (on) { ctx.globalCompositeOperation = 'lighter'; bloom(ctx, 85 * Math.cos(a), 85 * Math.sin(a), 8, CYAN, 0.7 + 0.2 * Math.sin(t * 60)); ctx.globalCompositeOperation = 'source-over'; }
        }
    },
};

// ============================================================================
// 6) ALTIN SERİ — işlenmiş altın: dönen yansımalar, birbirine geçen giyoş deseni,
//    elmas taşlar, yıldız parıltıları ve altın tozu
// ============================================================================

const GOLD_STOPS = ['#7a5412', '#f3d572', '#fff7d1', '#d9a733', '#8c6315'];
const GOLD_DUST: RGB = [196, 146, 30];

const goldGradient = (ctx: CanvasRenderingContext2D, angle: number, repeat: number): CanvasGradient => {
    if (!ctx.createConicGradient) {
        const g = ctx.createLinearGradient(-100, -100, 100, 100);
        GOLD_STOPS.forEach((c, i) => g.addColorStop(i / (GOLD_STOPS.length - 1), c));
        return g;
    }
    const g = ctx.createConicGradient(angle, 0, 0);
    const n = GOLD_STOPS.length;
    for (let r = 0; r < repeat; r++) {
        for (let i = 0; i < n; i++) g.addColorStop((r + i / n) / repeat, GOLD_STOPS[i]);
    }
    g.addColorStop(1, GOLD_STOPS[0]);
    return g;
};

interface Glint { a: number; r: number; age: number; life: number; size: number }
interface Dust { a: number; r: number; w: number; ph: number; size: number }

export const star = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, alpha: number) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const r = i % 2 ? size * 0.16 : size * (i % 4 ? 0.6 : 1), a = (i / 8) * TAU;
        ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
};

const gold: FrameDef<{ glints: Glint[]; dust: Dust[]; next: number }> = {
    init: ({ rnd }) => ({
        glints: [], next: 0.2,
        dust: Array.from({ length: 30 }, () => ({ a: rnd() * TAU, r: 103 + rnd() * 20, w: (0.08 + rnd() * 0.2) * (rnd() < 0.5 ? 1 : -1), ph: rnd() * TAU, size: 0.5 + rnd() * 0.9 })),
    }),
    step: (s, { dt, rnd }) => {
        for (const d of s.dust) d.a += d.w * dt;
        for (const g of s.glints) g.age += dt;
        s.glints = s.glints.filter(g => g.age < g.life);
        if ((s.next -= dt) <= 0) {
            s.next = 0.22 + rnd() * 0.4;
            s.glints.push({ a: rnd() * TAU, r: 75 + rnd() * 23, age: 0, life: 0.55 + rnd() * 0.4, size: 4 + rnd() * 6 });
        }
    },
    draw: (s, { ctx, t }) => {
        // Üç katmanlı pah: yansımalar katmanlarda ters yönde döner
        annulus(ctx, 92.5, 100.5); ctx.fillStyle = goldGradient(ctx, t * 0.6, 3); ctx.fill();
        annulus(ctx, 77.5, 93); ctx.fillStyle = goldGradient(ctx, -t * 0.35 + 1, 2); ctx.fill();
        annulus(ctx, 77.5, 93); ctx.fillStyle = 'rgba(70,40,0,.2)'; ctx.fill();
        annulus(ctx, 71.5, 78); ctx.fillStyle = goldGradient(ctx, t * 0.6 + 1.1, 3); ctx.fill();

        // Giyoş: zıt fazlı iki rozet dalgası birbirinin içinden geçer
        ctx.lineWidth = 0.7;
        for (const [dir, col] of [[1, 'rgba(84,54,4,.6)'], [-1, 'rgba(255,250,222,.55)']] as const) {
            for (const off of [0, Math.PI]) {
                ctx.strokeStyle = col;
                ctx.beginPath();
                for (let i = 0; i <= 360; i++) {
                    const a = (i / 360) * TAU;
                    const r = 85.2 + 5.2 * Math.sin(18 * a + dir * t * 0.9 + off);
                    i ? ctx.lineTo(r * Math.cos(a), r * Math.sin(a)) : ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
                }
                ctx.stroke();
            }
        }
        ctx.strokeStyle = 'rgba(70,45,5,.6)'; ctx.lineWidth = 0.6;
        for (const r of [78, 92.7]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,252,230,.7)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.arc(0, 0, 100.2, 0, TAU); ctx.stroke();

        // Dönen ışık süpürmesi
        if (ctx.createConicGradient) {
            const sweep = ctx.createConicGradient(t * 1.15, 0, 0);
            for (const c of [0.25, 0.75]) {
                sweep.addColorStop(c - 0.05, 'rgba(255,255,255,0)');
                sweep.addColorStop(c, 'rgba(255,255,255,.6)');
                sweep.addColorStop(c + 0.05, 'rgba(255,255,255,0)');
            }
            annulus(ctx, 71.5, 100.5); ctx.fillStyle = sweep; ctx.fill();
        }

        // Dört ana yönde elmas taşlar: süpürme geçerken parlar
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * TAU - Math.PI / 2;
            const hit = Math.pow(Math.max(0, Math.cos(a - t * 1.15 - Math.PI / 2)), 24) + Math.pow(Math.max(0, Math.cos(a - t * 1.15 + Math.PI / 2)), 24);
            ctx.save();
            ctx.rotate(a); ctx.translate(96.5, 0);
            ctx.fillStyle = '#5b3d08';
            ctx.beginPath(); ctx.moveTo(-4.6, 0); ctx.lineTo(0, -4.6); ctx.lineTo(4.6, 0); ctx.lineTo(0, 4.6); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#eaf6ff';
            ctx.beginPath(); ctx.moveTo(-3.5, 0); ctx.lineTo(0, -3.5); ctx.lineTo(3.5, 0); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#9fc4e6';
            ctx.beginPath(); ctx.moveTo(-3.5, 0); ctx.lineTo(0, 3.5); ctx.lineTo(3.5, 0); ctx.closePath(); ctx.fill();
            ctx.restore();
            if (hit > 0.05) star(ctx, 96.5 * Math.cos(a), 96.5 * Math.sin(a), 5 + 9 * hit, t * 0.5, clamp(hit * 1.4));
        }

        // Yıldız parıltıları ve çerçevenin dışında süzülen altın tozu
        for (const g of s.glints) {
            const q = Math.sin(Math.PI * (g.age / g.life));
            star(ctx, g.r * Math.cos(g.a), g.r * Math.sin(g.a), g.size * q, g.age * 1.6, q);
        }
        for (const d of s.dust) {
            const tw = 0.5 + 0.5 * Math.sin(t * 2.4 + d.ph);
            ctx.fillStyle = rgba(GOLD_DUST, 0.25 + 0.7 * tw);
            ctx.beginPath(); ctx.arc(d.r * Math.cos(d.a), d.r * Math.sin(d.a) + 2 * Math.sin(t + d.ph), d.size * (0.7 + 0.5 * tw), 0, TAU); ctx.fill();
        }
    },
};

// Çerçeve ekranda yeterince büyükse küçük metinler (pusula harfleri, tur süresi) çizilir
const showText = (ctx: CanvasRenderingContext2D) => ctx.getTransform().a * 200 > 140;

// ============================================================================
// 7) TİTANYUM KIVILCIM — tema renginde diz kaydırağı asfaltı sıyırır: kıvılcımlar yerçekimiyle savrulur,
//    titanyum parçalar havada patlar, arkada beyazdan kızıla soğuyan bir iz kalır
// ============================================================================

interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; w: number; burst: boolean }

// k = 1 en sıcak (beyaz), k = 0 soğumuş (koyu kızıl)
const heat = (k: number): RGB => k > 0.66 ? mix([255, 185, 70], [255, 250, 228], (k - 0.66) / 0.34)
    : k > 0.33 ? mix([225, 60, 18], [255, 185, 70], (k - 0.33) / 0.33)
    : mix([70, 12, 10], [225, 60, 18], k / 0.33);

const SPARK_R = 92;

const sparks: FrameDef<{ th: number; list: Spark[]; acc: number; speck: [number, number, number][] }> = {
    init: ({ rnd }) => ({
        th: -Math.PI / 2, list: [], acc: 0,
        speck: Array.from({ length: 260 }, () => {
            const a = rnd() * TAU, r = 73 + rnd() * 26;
            return [r * Math.cos(a), r * Math.sin(a), rnd() < 0.5 ? 1 : 0] as [number, number, number];
        }),
    }),
    step: (s, { dt, t, rnd }) => {
        s.th += (1.6 + 1.1 * Math.sin(t * 0.8) ** 2) * dt;
        s.acc += dt * 440 * (0.6 + 0.4 * Math.sin(t * 2.1) ** 2);
        const c = Math.cos(s.th), sn = Math.sin(s.th);
        while (s.acc >= 1) {
            s.acc -= 1;
            if (s.list.length > 700) continue;
            // Kıvılcımlar hareketin tersine ve dışa doğru fırlar
            const back = 80 + rnd() * 200, out = 10 + rnd() * 90, max = 0.35 + rnd() * 0.65;
            s.list.push({
                x: SPARK_R * c, y: SPARK_R * sn,
                vx: sn * back + c * out + (rnd() - 0.5) * 40,
                vy: -c * back + sn * out + (rnd() - 0.5) * 40,
                life: max, max, w: 0.7 + rnd() * 1.1, burst: rnd() < 0.1,
            });
        }
        const born: Spark[] = [];
        const drag = 1 - 1.5 * dt;
        for (const p of s.list) {
            p.vy += 250 * dt; p.vx *= drag; p.vy *= drag;
            p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
            if (p.burst && p.life < p.max * 0.5) {
                p.burst = false;
                for (let i = 0; i < 5; i++) {
                    const a = rnd() * TAU, v = 45 + rnd() * 95;
                    born.push({ x: p.x, y: p.y, vx: p.vx * 0.3 + v * Math.cos(a), vy: p.vy * 0.3 + v * Math.sin(a), life: 0.12 + rnd() * 0.25, max: 0.37, w: 0.45, burst: false });
                }
            }
        }
        s.list = s.list.filter(p => p.life > 0 && p.x * p.x + p.y * p.y < 132 * 132);
        for (const b of born) s.list.push(b);
    },
    draw: (s, { ctx, t, accent }) => {
        substrate(ctx, '#2b2c31', '#18191d', '#232429');
        for (const light of [1, 0]) {
            ctx.fillStyle = light ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.3)';
            ctx.beginPath();
            for (const [x, y, l] of s.speck) if (l === light) ctx.rect(x, y, 0.9, 0.9);
            ctx.fill();
        }
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = rgba(accent, 0.55); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, 79, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);

        // Soğuyan kızgın iz: önce geniş ışıma, sonra iz
        ctx.lineCap = 'butt';
        const SEG = 64, span = 2.9;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 20; i >= 0; i--) {
            const d0 = (i / 20) * 1.2, d1 = ((i + 1.15) / 20) * 1.2;
            const k = Math.exp(-d0 * 1.6);
            ctx.strokeStyle = rgba(heat(0.4 + 0.6 * k), 0.22 * k);
            ctx.lineWidth = 7 * k + 2;
            ctx.beginPath(); ctx.arc(0, 0, SPARK_R, s.th - d1, s.th - d0); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        for (let i = SEG - 1; i >= 0; i--) {
            const d0 = (i / SEG) * span, d1 = ((i + 1.15) / SEG) * span;
            const k = Math.exp(-d0 * 0.9);
            ctx.strokeStyle = rgba(heat(k), 0.3 + 0.7 * k);
            ctx.lineWidth = 1.6 + 1.8 * k;
            ctx.beginPath(); ctx.arc(0, 0, SPARK_R, s.th - d1, s.th - d0); ctx.stroke();
        }

        // Kıvılcımlar: koyu turuncu kontur açık zeminde okunmayı sağlar, üstüne parlak çekirdek
        ctx.lineCap = 'round';
        for (const p of s.list) {
            const k = clamp(p.life / p.max);
            ctx.strokeStyle = rgba([150, 38, 0], 0.5 * k);
            ctx.lineWidth = p.w + 1.3;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const p of s.list) {
            const k = clamp(p.life / p.max);
            ctx.strokeStyle = rgba(heat(0.3 + 0.7 * k), 0.5 + 0.5 * k);
            ctx.lineWidth = p.w;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
        }
        const cx = SPARK_R * Math.cos(s.th), cy = SPARK_R * Math.sin(s.th);
        bloom(ctx, cx, cy, 16 + 3 * Math.sin(t * 50), [255, 200, 120], 1);
        ctx.globalCompositeOperation = 'source-over';

        // Diz kaydırağı
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(s.th + Math.PI / 2);
        ctx.fillStyle = rgba(accent, 1); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.roundRect(-4.5, -3, 9, 6, 2.5); ctx.fill(); ctx.stroke();
        ctx.restore();
    },
};

// ============================================================================
// 8) KASK HUD — akıllı kask ekranı: dönen pusula, segmentli halkalar, radar taraması, yay üzerinde
//    kayıp yatan motor simgesiyle yatış açısı, hız barı, hedef kilitleme ve ara sıra dijital parazit
// ============================================================================

const hudLean = (t: number) => 54 * Math.sin(t * 0.8) * (0.7 + 0.3 * Math.sin(t * 0.27));
const hudSpeed = (t: number) => clamp(0.52 + 0.42 * Math.sin(t * 0.43 + 1.2));
const COMPASS = ['K', 'D', 'G', 'B'];
const leanAng = (deg: number) => Math.PI / 2 - deg * DEG * 0.95;

interface HudState { glitch: number; next: number; peakL: number; peakR: number }

const hudLayer = (s: HudState, { ctx, t }: Env, col: RGB, a: number) => {
    const text = showText(ctx);
    const hi = mix(col, WHITE, 0.55);
    const heading = t * 0.18 + 0.7 * Math.sin(t * 0.21);

    // Pusula: dönen çizgi halkası, yön harfleri ve sabit imleç
    ctx.save();
    ctx.rotate(-heading);
    ctx.strokeStyle = rgba(col, 0.75 * a); ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = 0; i < 72; i++) {
        const ang = (i / 72) * TAU, r0 = i % 6 === 0 ? 94.5 : 96.8;
        ctx.moveTo(r0 * Math.cos(ang), r0 * Math.sin(ang)); ctx.lineTo(99.2 * Math.cos(ang), 99.2 * Math.sin(ang));
    }
    ctx.stroke();
    ctx.restore();
    if (text) {
        ctx.font = '800 6px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        COMPASS.forEach((c, i) => {
            const ang = -Math.PI / 2 + (i * Math.PI) / 2 - heading;
            ctx.fillStyle = rgba(i === 0 ? RED : hi, a);
            ctx.fillText(c, 91 * Math.cos(ang), 91 * Math.sin(ang));
        });
    }
    ctx.fillStyle = rgba(hi, a);
    ctx.beginPath(); ctx.moveTo(0, -93.5); ctx.lineTo(-2.4, -100.6); ctx.lineTo(2.4, -100.6); ctx.closePath(); ctx.fill();

    // Segmentli dönen yaylar (alt bölge yatış göstergesine ayrılmış)
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 130, 150 * DEG, 390 * DEG); ctx.closePath(); ctx.clip();
    ctx.setLineDash([3, 1.6]); ctx.lineWidth = 2.2;
    for (const [len, sp, off, al] of [[1.5, 0.55, 0, 0.9], [0.8, -1.05, 2, 0.6], [2.2, 0.22, 4, 0.4]]) {
        const st = off + t * sp;
        ctx.strokeStyle = rgba(col, al * a);
        ctx.beginPath(); ctx.arc(0, 0, 86.5, st, st + len); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Radar taraması ve iç halka
    if (ctx.createConicGradient) {
        const g = ctx.createConicGradient(-t * 1.6, 0, 0);
        g.addColorStop(0, rgba(col, 0.3 * a));
        g.addColorStop(0.14, rgba(col, 0));
        g.addColorStop(1, rgba(col, 0));
        annulus(ctx, 72, 93); ctx.fillStyle = g; ctx.fill();
    }
    ctx.strokeStyle = rgba(col, 0.35 * a); ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.arc(0, 0, 74.2, 0, TAU); ctx.stroke();

    // Yatış açısı: alt yay, 15 derecelik çentikler, tepe değer izleri ve yay üzerinde yatan motor simgesi
    const lean = hudLean(t);
    ctx.strokeStyle = rgba(col, 0.55 * a); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(0, 0, 78, leanAng(60), leanAng(-60)); ctx.stroke();
    ctx.beginPath();
    for (let d = -60; d <= 60; d += 15) {
        const g = leanAng(d), r0 = d % 30 === 0 ? 75.5 : 76.6;
        ctx.moveTo(r0 * Math.cos(g), r0 * Math.sin(g)); ctx.lineTo(78 * Math.cos(g), 78 * Math.sin(g));
    }
    ctx.stroke();
    ctx.strokeStyle = rgba(RED, 0.9 * a); ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const d of [-s.peakL, s.peakR]) {
        const g = leanAng(d);
        ctx.moveTo(76 * Math.cos(g), 76 * Math.sin(g)); ctx.lineTo(80.5 * Math.cos(g), 80.5 * Math.sin(g));
    }
    ctx.stroke();
    const g = leanAng(lean);
    ctx.save();
    ctx.translate(84.5 * Math.cos(g), 84.5 * Math.sin(g));
    ctx.rotate(g - Math.PI / 2 + lean * DEG);
    ctx.fillStyle = rgba(hi, a); ctx.strokeStyle = rgba(hi, a); ctx.lineWidth = 0.9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.roundRect(-1.1, -0.4, 2.2, 4.8, 1.1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -0.4); ctx.lineTo(0, -4.2); ctx.moveTo(-3, -2.3); ctx.lineTo(3, -2.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -5.7, 1.35, 0, TAU); ctx.fill();
    ctx.restore();
    if (text) {
        ctx.font = '700 5.5px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = rgba(hi, a);
        ctx.fillText(`${Math.abs(Math.round(lean))}°${lean > 2 ? ' S' : lean < -2 ? ' L' : ''}`, 0, 94.5);
    }

    // Hız barı (sağ yay) ve dijital hız (sol)
    const spd = hudSpeed(t);
    ctx.lineWidth = 3; ctx.lineCap = 'butt';
    for (let i = 0; i < 16; i++) {
        const a0 = -42 * DEG + (i / 16) * 70 * DEG;
        const on = i / 16 < spd;
        ctx.strokeStyle = on ? rgba(i > 12 ? RED : col, a) : rgba(col, 0.15 * a);
        ctx.beginPath(); ctx.arc(0, 0, 79, a0, a0 + (70 * DEG) / 16 * 0.7); ctx.stroke();
    }
    if (text) {
        ctx.font = '800 8px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = rgba(WHITE, 0.92 * a);
        ctx.fillText(String(Math.round(40 + spd * 260)), -81, -1.5);
        ctx.font = '700 3.6px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = rgba(hi, 0.8 * a);
        ctx.fillText('KM/SA', -81, 4.5);
    }

    // Hedef kilitleme: köşe parantezleri dışarıdan gelip avatara kilitlenir
    const lp = (t % 7) / 0.7;
    const R = lp < 1 ? lerp(104, 75.5, 1 - (1 - lp) ** 3) : 75.5 + 0.8 * Math.sin(t * 6);
    const flash = lp >= 1 && lp < 1.6 ? 1 - (lp - 1) / 0.6 : 0;
    ctx.strokeStyle = rgba(mix(col, WHITE, flash), a); ctx.lineWidth = 1.2 + flash;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
        const c = (45 + i * 90) * DEG;
        const p = [R * Math.cos(c), R * Math.sin(c)];
        const d1 = c + Math.PI / 2, d2 = c - Math.PI / 2;
        ctx.moveTo(p[0] + 5 * Math.cos(d1), p[1] + 5 * Math.sin(d1));
        ctx.lineTo(p[0], p[1]);
        ctx.lineTo(p[0] + 5 * Math.cos(d2), p[1] + 5 * Math.sin(d2));
    }
    ctx.stroke();
};

const hud: FrameDef<HudState> = {
    init: () => ({ glitch: 0, next: 3, peakL: 0, peakR: 0 }),
    step: (s, { dt, t, rnd }) => {
        if ((s.next -= dt) <= 0) { s.glitch = 0.2; s.next = 4 + rnd() * 4; }
        s.glitch = Math.max(0, s.glitch - dt);
        const lean = hudLean(t);
        s.peakL = Math.max(s.peakL - dt * 3, -lean);
        s.peakR = Math.max(s.peakR - dt * 3, lean);
    },
    draw: (s, env) => {
        const { ctx } = env;
        substrate(ctx, '#0c1218', '#05080c', '#0b1119');
        ctx.save();
        annulus(ctx, 72, 100.5); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,.035)';
        for (let y = -100; y < 100; y += 2.2) ctx.fillRect(-100, y, 200, 0.7);
        ctx.restore();
        if (s.glitch > 0) {
            const j = 1 + env.rnd() * 2;
            ctx.globalCompositeOperation = 'lighter';
            ctx.save(); ctx.translate(-j, 0); hudLayer(s, env, [255, 40, 90], 0.55); ctx.restore();
            ctx.save(); ctx.translate(j, 0.6); hudLayer(s, env, [40, 220, 255], 0.55); ctx.restore();
            ctx.globalCompositeOperation = 'source-over';
        }
        hudLayer(s, env, env.accent, s.glitch > 0 ? 0.8 : 1);
    },
};

// ============================================================================
// 9) MOTOR NABZI — çerçeve dairesel bir osiloskop: 45° V2 motorun düzensiz ateşlemesi fosfor izi olarak
//    çizilir; gaz köklenince devir yükselir, dalga genliği ve tarama hızı artar
// ============================================================================

// Halka iki tam çevrimi (1440° krank) gösterir; ateşlemeler 0° ve 405°'de olduğu için aralıklar eşit değildir
const FIRING = [0, 405, 720, 1125];
const fhash = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

const pulseRpm = (c: number) => {
    if (c < 3.2) return 1050 + 40 * Math.sin(c * 17);
    if (c < 3.45) return lerp(1050, 7400, ((c - 3.2) / 0.25) ** 0.6);
    return 1050 + 6350 * Math.exp(-(c - 3.45) * 3.2);
};

const engineWave = (deg: number, rk: number, sweep: number) => {
    let v = 0;
    for (let k = 0; k < FIRING.length; k++) {
        let x = deg - FIRING[k];
        if (x < 0) x += 1440;
        if (x > 420) continue;
        const amp = (0.8 + 0.35 * rk) * (0.82 + 0.36 * fhash(sweep * 7 + k));
        v += amp * Math.exp(-x / (70 + 40 * rk)) * Math.sin(x / (8.5 - 3 * rk));
        v += 0.12 * Math.exp(-(((x - 190) / 16) ** 2));
    }
    return v;
};

const PULSE_N = 300;

const pulse: FrameDef<{ beam: number; rpm: number; cyc: number; flash: number; px: Float32Array; py: Float32Array }> = {
    init: () => ({ beam: 0, rpm: 1050, cyc: 0, flash: 0, px: new Float32Array(PULSE_N + 1), py: new Float32Array(PULSE_N + 1) }),
    step: (s, { dt }) => {
        const prev = s.cyc;
        s.cyc = (s.cyc + dt) % 6;
        if (prev < 3.2 && s.cyc >= 3.2) s.flash = 1;
        s.rpm = pulseRpm(s.cyc);
        s.beam += (1.2 + s.rpm / 2600) * dt;
        s.flash = Math.max(0, s.flash - dt * 1.6);
    },
    draw: (s, { ctx, accent }) => {
        substrate(ctx, '#0b100e', '#040706', '#0a0f0d');
        const rk = clamp((s.rpm - 1050) / 6350);
        ctx.strokeStyle = rgba(accent, 0.13); ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (const r of [77, 86, 95]) { ctx.moveTo(r, 0); ctx.arc(0, 0, r, 0, TAU); }
        for (let i = 0; i < 24; i++) {
            const a = (i / 24) * TAU;
            ctx.moveTo(73 * Math.cos(a), 73 * Math.sin(a)); ctx.lineTo(99 * Math.cos(a), 99 * Math.sin(a));
        }
        ctx.stroke();

        // Izın her noktası, ışın oradan geçtiği andaki taramaya aittir; geride kaldıkça söner
        const span = TAU * 0.93;
        for (let i = 0; i <= PULSE_N; i++) {
            const total = s.beam - (i / PULSE_N) * span;
            const th = ((total % TAU) + TAU) % TAU;
            const v = engineWave((th / TAU) * 1440, rk, Math.floor(total / TAU));
            const r = 86 + 11 * clamp(v, -1.1, 1.1);
            s.px[i] = r * Math.cos(th - Math.PI / 2);
            s.py[i] = r * Math.sin(th - Math.PI / 2);
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        const CH = 30, core = mix(accent, WHITE, 0.45);
        for (let c = CH - 1; c >= 0; c--) {
            const i0 = Math.floor((c * PULSE_N) / CH), i1 = Math.floor(((c + 1) * PULSE_N) / CH);
            const fade = Math.exp(-(c / CH) * 2.6);
            for (const [w, al, colr] of [[5, 0.25, accent], [1.5, 1, core]] as [number, number, RGB][]) {
                ctx.strokeStyle = rgba(colr, al * fade); ctx.lineWidth = w;
                ctx.beginPath(); ctx.moveTo(s.px[i0], s.py[i0]);
                for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(s.px[i], s.py[i]);
                ctx.stroke();
            }
        }
        bloom(ctx, s.px[0], s.py[0], 7 + 4 * rk, accent, 1);
        ctx.globalCompositeOperation = 'source-over';
        if (s.flash > 0) {
            ctx.strokeStyle = rgba(accent, s.flash * 0.7); ctx.lineWidth = 1.5 + 3 * s.flash;
            ctx.beginPath(); ctx.arc(0, 0, 100.5 + 6 * (1 - s.flash), 0, TAU); ctx.stroke();
        }
    },
};

// ============================================================================
// 10) KUSTOM BOYA — tema renginden şeker (candy) boya; içindeki metal pullar dönen ışıkta parıldar,
//     görünmez bir fırça Von Dutch tarzı simetrik pinstripe süslemesini çizer, bekletir ve yeniden çizer
// ============================================================================

type Pt = [number, number];

// Motif yerel koordinatlarda: x halka boyunca yay uzunluğu, y yarıçaptan sapma
const KUSTOM_MOTIF: Pt[][] = (() => {
    const strokes: Pt[][] = [];
    const curve = (f: (u: number) => Pt, n: number) => strokes.push(Array.from({ length: n + 1 }, (_, i) => f(i / n)));
    curve(u => [-44 + 88 * u, 7.6 * Math.sin(Math.PI * u)], 40);
    curve(u => [-44 + 88 * u, -7.6 * Math.sin(Math.PI * u)], 40);
    curve(u => [-20 + 40 * u, 3.4 * Math.sin(Math.PI * u)], 22);
    curve(u => [-20 + 40 * u, -3.4 * Math.sin(Math.PI * u)], 22);
    for (const side of [1, -1]) {
        curve(u => {
            const a = u * 3.3 * Math.PI, rho = 5.2 * (1 - u * 0.85);
            return [side * (49 - rho * Math.cos(a)), rho * Math.sin(a)];
        }, 50);
    }
    curve(u => [1.6 * Math.sin(u * TAU), 1.6 * Math.cos(u * TAU)], 20);
    return strokes;
})();

const KUSTOM_LEN = KUSTOM_MOTIF.map(st => st.reduce((sum, p, i) => i ? sum + Math.hypot(p[0] - st[i - 1][0], p[1] - st[i - 1][1]) : 0, 0));
const KUSTOM_TOTAL = KUSTOM_LEN.reduce((a, b) => a + b, 0);
const PINSTRIPE: RGB = [255, 241, 193];

interface Flake { x: number; y: number; o: number; s: number }

const kustom: FrameDef<{ flakes: Flake[]; cyc: number }> = {
    init: ({ rnd }) => ({
        cyc: 0,
        flakes: Array.from({ length: 320 }, () => {
            const a = rnd() * TAU, r = 73 + rnd() * 26;
            return { x: r * Math.cos(a), y: r * Math.sin(a), o: rnd() * TAU, s: 0.6 + rnd() * 0.8 };
        }),
    }),
    step: (s, { dt }) => { s.cyc = (s.cyc + dt) % 7; },
    draw: (s, { ctx, t, accent }) => {
        const deep = mix(accent, [0, 0, 0], 0.72), mid = mix(accent, [0, 0, 0], 0.35), hi = mix(accent, WHITE, 0.3);
        const g = ctx.createRadialGradient(0, 0, 71.5, 0, 0, 100);
        g.addColorStop(0, rgba(deep, 1)); g.addColorStop(0.1, rgba(hi, 1)); g.addColorStop(0.24, rgba(mid, 1));
        g.addColorStop(0.55, rgba(deep, 1)); g.addColorStop(0.86, rgba(mid, 1)); g.addColorStop(0.94, rgba(hi, 1));
        g.addColorStop(1, rgba(deep, 1));
        annulus(ctx, 71.5, 100); ctx.fillStyle = g; ctx.fill();

        // Metal pullar: yönleri ışığa denk geldiğinde parlar
        const L = t * 0.8;
        ctx.globalCompositeOperation = 'lighter';
        for (const f of s.flakes) {
            const b = Math.max(0, Math.cos(2 * (f.o - L))) ** 30;
            const sz = f.s * (0.7 + 0.8 * b);
            ctx.fillStyle = rgba(mix(accent, WHITE, 0.6 + 0.4 * b), 0.08 + 0.92 * b);
            ctx.fillRect(f.x - sz / 2, f.y - sz / 2, sz, sz);
        }
        ctx.globalCompositeOperation = 'source-over';

        // Vernik parlaması
        if (ctx.createConicGradient) {
            const sw = ctx.createConicGradient(t * 0.7, 0, 0);
            for (const c of [0.25, 0.75]) {
                sw.addColorStop(c - 0.06, 'rgba(255,255,255,0)');
                sw.addColorStop(c, 'rgba(255,255,255,.4)');
                sw.addColorStop(c + 0.06, 'rgba(255,255,255,0)');
            }
            annulus(ctx, 71.5, 100); ctx.fillStyle = sw; ctx.fill();
        }
        ctx.strokeStyle = rgba(PINSTRIPE, 0.85); ctx.lineWidth = 0.6;
        for (const r of [72.7, 99.3]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); }

        // Pinstripe: 4 motif aynı anda, fırça ucu parlar
        const ease = (x: number) => x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
        const prog = s.cyc < 3.4 ? ease(s.cyc / 3.4) : 1;
        const alpha = s.cyc < 6.1 ? 1 : 1 - (s.cyc - 6.1) / 0.9;
        let budget = prog * KUSTOM_TOTAL;
        let tip: Pt | null = null;
        const toRing = (c: number, [x, y]: Pt): Pt => {
            const a = c + x / 86, r = 86 + y;
            return [r * Math.cos(a), r * Math.sin(a)];
        };
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        const centers = [-90, 0, 90, 180].map(d => d * DEG);
        for (let si = 0; si < KUSTOM_MOTIF.length && budget > 0; si++) {
            const st = KUSTOM_MOTIF[si];
            const take = Math.min(budget, KUSTOM_LEN[si]);
            budget -= take;
            for (const [w, col, al] of [[2.4, [0, 0, 0] as RGB, 0.55], [1.3, PINSTRIPE, 1]] as [number, RGB, number][]) {
                ctx.strokeStyle = rgba(col, al * alpha); ctx.lineWidth = w;
                ctx.beginPath();
                for (const c of centers) {
                    let used = 0;
                    let p = toRing(c, st[0]);
                    ctx.moveTo(p[0], p[1]);
                    for (let i = 1; i < st.length && used < take; i++) {
                        const seg = Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]);
                        const k = Math.min(1, (take - used) / seg);
                        p = toRing(c, [lerp(st[i - 1][0], st[i][0], k), lerp(st[i - 1][1], st[i][1], k)]);
                        ctx.lineTo(p[0], p[1]);
                        used += seg;
                    }
                    if (c === centers[0]) tip = p;
                }
                ctx.stroke();
            }
        }
        if (tip && prog < 1) {
            ctx.globalCompositeOperation = 'lighter';
            for (const c of centers) {
                const a = c - centers[0];
                const [x, y] = tip;
                bloom(ctx, x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), 5, PINSTRIPE, 0.9);
            }
            ctx.globalCompositeOperation = 'source-over';
        }
    },
};

// ============================================================================
// 11) PODYUM — altın defne çelengi yapraklarını açarak büyür; altında tema renginde kurdele ve "1" madalyonu,
//     her birkaç saniyede şampanya patlar ve konfeti yağar
// ============================================================================

interface Leaf { x: number; y: number; rot: number; len: number; u: number }
interface Confetto { x: number; y: number; vx: number; vy: number; rot: number; vr: number; spin: number; vs: number; c: RGB; life: number }
interface Drop { x: number; y: number; vx: number; vy: number; life: number; r: number }

const LAUREL_R = 88;
const LAUREL: Leaf[] = (() => {
    const leaves: Leaf[] = [];
    const N = 12;
    for (const side of [1, -1]) {
        for (let i = 0; i < N; i++) {
            const u = i / (N - 1);
            const ang = lerp(80, -58, u) * DEG;
            const base = Math.atan2(-Math.cos(ang), side * Math.sin(ang));
            for (const k of [1, -1]) {
                leaves.push({ x: side * LAUREL_R * Math.cos(ang), y: LAUREL_R * Math.sin(ang), rot: base + side * k * 0.62, len: lerp(12.5, 7, u), u });
            }
        }
    }
    return leaves;
})();

const CONFETTI_COLORS: RGB[] = [[214, 168, 58], [239, 68, 68], [190, 196, 208], [59, 130, 246]];

const podium: FrameDef<{ grow: number; burst: number; next: number; drops: Drop[]; confetti: Confetto[]; spray: number }> = {
    init: () => ({ grow: 0, burst: 0, next: 1.4, drops: [], confetti: [], spray: 0 }),
    step: (s, { dt, rnd, accent }) => {
        s.grow = Math.min(1, s.grow + dt / 1.8);
        if ((s.next -= dt) <= 0) {
            s.next = 5;
            s.spray = 0.4;
            for (let i = 0; i < 80; i++) {
                const a = (-170 + rnd() * 160) * DEG, r = 100 + rnd() * 18;
                s.confetti.push({
                    x: r * Math.cos(a), y: r * Math.sin(a), vx: Math.cos(a) * 30 + (rnd() - 0.5) * 40, vy: -40 - rnd() * 60,
                    rot: rnd() * TAU, vr: (rnd() - 0.5) * 8, spin: rnd() * TAU, vs: 6 + rnd() * 8,
                    c: rnd() < 0.3 ? accent : CONFETTI_COLORS[(rnd() * CONFETTI_COLORS.length) | 0], life: 2.6 + rnd(),
                });
            }
        }
        if (s.spray > 0) {
            s.spray -= dt;
            for (const src of [-125, -55]) {
                for (let i = 0; i < 4; i++) {
                    const a = src * DEG + (rnd() - 0.5) * 0.4, v = 80 + rnd() * 100;
                    s.drops.push({ x: 100 * Math.cos(src * DEG), y: 100 * Math.sin(src * DEG), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50, life: 0.8 + rnd() * 0.6, r: 0.6 + rnd() * 1 });
                }
            }
        }
        for (const d of s.drops) { d.vy += 300 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; }
        s.drops = s.drops.filter(d => d.life > 0);
        for (const c of s.confetti) {
            c.vy += 90 * dt; c.vx *= 1 - 1.8 * dt; c.vy *= 1 - 1.8 * dt;
            c.x += (c.vx + 14 * Math.sin(c.spin)) * dt; c.y += c.vy * dt;
            c.rot += c.vr * dt; c.spin += c.vs * dt; c.life -= dt;
        }
        s.confetti = s.confetti.filter(c => c.life > 0 && c.y < 130);
    },
    draw: (s, { ctx, t, accent }) => {
        // Avatar kenarında altın halka
        const ring = ctx.createLinearGradient(-72, -72, 72, 72);
        ring.addColorStop(0, '#fff3c4'); ring.addColorStop(0.5, '#b8862a'); ring.addColorStop(1, '#f3d572');
        ctx.strokeStyle = ring; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 72.6, 0, TAU); ctx.stroke();

        // Kurdele kuyrukları
        const sway = 2 * Math.sin(t * 2.2);
        ctx.fillStyle = rgba(mix(accent, [0, 0, 0], 0.15), 1);
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(side * 2, 92);
            ctx.lineTo(side * 7, 92);
            ctx.lineTo(side * (12 + sway), 113);
            ctx.lineTo(side * (8.5 + sway), 110);
            ctx.lineTo(side * (5.5 + sway), 115);
            ctx.closePath(); ctx.fill();
        }

        // Dallar ve yapraklar
        const grow = s.grow;
        ctx.strokeStyle = 'rgba(150,108,28,.9)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        for (const side of [1, -1]) {
            const end = lerp(80, -58, grow) * DEG;
            ctx.beginPath();
            if (side === 1) ctx.arc(0, 0, LAUREL_R, 80 * DEG, end, true);
            else ctx.arc(0, 0, LAUREL_R, Math.PI - 80 * DEG, Math.PI - end, false);
            ctx.stroke();
        }
        const leafGrad = ctx.createLinearGradient(0, -3, 0, 3);
        leafGrad.addColorStop(0, '#fff1b8'); leafGrad.addColorStop(0.45, '#e2b54a'); leafGrad.addColorStop(1, '#8a6115');
        const sweepPos = ((t * 0.45) % 1.8) - 0.2;
        for (const l of LAUREL) {
            const k = clamp((grow - l.u * 0.7) / 0.3);
            if (k <= 0) continue;
            const sc = 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
            const len = l.len * sc;
            ctx.save();
            ctx.translate(l.x, l.y); ctx.rotate(l.rot);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(len * 0.45, -len * 0.36, len, 0);
            ctx.quadraticCurveTo(len * 0.45, len * 0.36, 0, 0);
            ctx.fillStyle = leafGrad; ctx.fill();
            const sh = Math.exp(-(((l.u - sweepPos) / 0.09) ** 2));
            if (sh > 0.02) { ctx.fillStyle = `rgba(255,255,255,${0.6 * sh})`; ctx.fill(); }
            ctx.strokeStyle = 'rgba(120,80,10,.55)'; ctx.lineWidth = 0.45;
            ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(len * 0.85, 0); ctx.stroke();
            ctx.restore();
        }

        // Madalyon
        const md = ctx.createRadialGradient(-2, 88, 1, 0, 91, 8);
        md.addColorStop(0, '#fff6d0'); md.addColorStop(0.55, '#e0b043'); md.addColorStop(1, '#8a6115');
        ctx.fillStyle = md;
        ctx.beginPath(); ctx.arc(0, 91, 7.2, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(110,72,8,.8)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(0, 91, 5.6, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#6b4708';
        ctx.font = 'italic 900 8.5px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('1', 0, 91.6);

        // Parıltılar
        for (let i = 0; i < 5; i++) {
            const ph = (t * 0.6 + i * 0.37) % 1;
            const a = (-150 + i * 30 + 10 * Math.sin(i * 5)) * DEG;
            star(ctx, 104 * Math.cos(a), 104 * Math.sin(a), 6 * Math.sin(Math.PI * ph), ph * 2, Math.sin(Math.PI * ph));
        }

        // Şampanya damlaları ve konfeti
        for (const d of s.drops) {
            const a = clamp(d.life * 2);
            ctx.fillStyle = `rgba(250,236,170,${a})`; ctx.strokeStyle = `rgba(170,120,20,${0.6 * a})`; ctx.lineWidth = 0.4;
            ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill(); ctx.stroke();
        }
        if (s.spray > 0) {
            for (const src of [-125, -55]) bloom(ctx, 100 * Math.cos(src * DEG), 100 * Math.sin(src * DEG), 12, [250, 236, 170], s.spray * 1.6);
        }
        // Konfeti fotoğrafın arkasından geçer
        ctx.save();
        annulus(ctx, 72, 140); ctx.clip();
        for (const c of s.confetti) {
            ctx.save();
            ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.scale(1, Math.cos(c.spin));
            ctx.fillStyle = rgba(mix(c.c, [0, 0, 0], Math.sin(c.spin) > 0 ? 0 : 0.25), clamp(c.life));
            ctx.fillRect(-2.2, -1.2, 4.4, 2.4);
            ctx.restore();
        }
        ctx.restore();
    },
};

// ============================================================================
// 12) TUR TELEMETRİSİ — avatarın etrafında virajlı bir pist: hız verisine göre renklenen yarış çizgisi,
//     tema renginde sürücü ve hayalet tur, geçilen sektör mor/yeşil/sarı yanar, alt etikette tur süresi
// ============================================================================

const TRACK_N = 360;
const SECTOR_COLORS: RGB[] = [[168, 85, 247], [34, 197, 94], [234, 179, 8]];
const LAP_SECONDS = 7;

interface Track { x: Float32Array; y: Float32Array; nx: Float32Array; ny: Float32Array; spd: Float32Array; kerb: Uint8Array }

const TRACK: Track = (() => {
    const x = new Float32Array(TRACK_N), y = new Float32Array(TRACK_N), nx = new Float32Array(TRACK_N), ny = new Float32Array(TRACK_N);
    for (let i = 0; i < TRACK_N; i++) {
        const th = (i / TRACK_N) * TAU + Math.PI / 2;
        const r = 86 + 4.4 * Math.sin(3 * th + 0.5) + 2.6 * Math.sin(5 * th - 1.2) + 1.1 * Math.sin(9 * th + 2);
        x[i] = r * Math.cos(th); y[i] = r * Math.sin(th);
        nx[i] = Math.cos(th); ny[i] = Math.sin(th);
    }
    const curv = new Float32Array(TRACK_N);
    for (let i = 0; i < TRACK_N; i++) {
        const a = (i + TRACK_N - 1) % TRACK_N, b = (i + 1) % TRACK_N;
        const h1 = Math.atan2(y[i] - y[a], x[i] - x[a]), h2 = Math.atan2(y[b] - y[i], x[b] - x[i]);
        let d = h2 - h1;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        curv[i] = Math.abs(d) / Math.hypot(x[b] - x[i], y[b] - y[i]);
    }
    const raw = new Float32Array(TRACK_N), spd = new Float32Array(TRACK_N), kerb = new Uint8Array(TRACK_N);
    for (let i = 0; i < TRACK_N; i++) raw[i] = 1 - clamp(curv[i] * 9);
    let lo = 1, hi = 0;
    for (let i = 0; i < TRACK_N; i++) {
        let sum = 0;
        for (let j = -12; j <= 12; j++) sum += raw[(i + j + TRACK_N) % TRACK_N];
        spd[i] = sum / 25;
        lo = Math.min(lo, spd[i]); hi = Math.max(hi, spd[i]);
    }
    const sorted = Array.from(curv).sort((p, q) => p - q);
    const kerbAt = sorted[Math.floor(TRACK_N * 0.82)];
    for (let i = 0; i < TRACK_N; i++) {
        spd[i] = (spd[i] - lo) / (hi - lo || 1);
        kerb[i] = curv[i] >= kerbAt ? 1 : 0;
    }
    return { x, y, nx, ny, spd, kerb };
})();

const telemetryColor = (v: number): RGB => v < 0.5 ? mix([239, 68, 68], [250, 204, 21], v / 0.5) : mix([250, 204, 21], [34, 197, 94], (v - 0.5) / 0.5);

const trackPath = (ctx: CanvasRenderingContext2D, i0: number, i1: number) => {
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
        const k = i % TRACK_N;
        i === i0 ? ctx.moveTo(TRACK.x[k], TRACK.y[k]) : ctx.lineTo(TRACK.x[k], TRACK.y[k]);
    }
};

const fmtLap = (sec: number) => {
    const m = Math.floor(sec / 60), s = sec - m * 60;
    return `${m}:${s < 10 ? '0' : ''}${s.toFixed(3)}`;
};

const telemetry: FrameDef<{ q: number; lapT: number; sector: number; flash: number[]; colors: RGB[]; avg: number }> = {
    init: () => {
        let sum = 0;
        for (let i = 0; i < TRACK_N; i++) sum += 1 / (0.45 + 0.55 * TRACK.spd[i]);
        return { q: 0, lapT: 0, sector: 0, flash: [0, 0, 0], colors: [SECTOR_COLORS[1], SECTOR_COLORS[1], SECTOR_COLORS[1]], avg: sum / TRACK_N };
    },
    step: (s, { dt, rnd }) => {
        const i = ((Math.floor(s.q * TRACK_N) % TRACK_N) + TRACK_N) % TRACK_N;
        s.q += ((0.45 + 0.55 * TRACK.spd[i]) * dt) / (LAP_SECONDS * s.avg);
        s.lapT += dt;
        if (s.q >= 1) { s.q -= 1; s.lapT = 0; }
        const sector = Math.floor(s.q * 3);
        if (sector !== s.sector) {
            const r = rnd();
            s.colors[s.sector] = SECTOR_COLORS[r < 0.3 ? 0 : r < 0.75 ? 1 : 2];
            s.flash[s.sector] = 1;
            s.sector = sector;
        }
        for (let k = 0; k < 3; k++) s.flash[k] = Math.max(0, s.flash[k] - dt * 0.6);
    },
    draw: (s, { ctx, t, accent }) => {
        substrate(ctx, '#121519', '#090b0e', '#111418');
        ctx.lineJoin = 'round'; ctx.lineCap = 'butt';

        // Pist: beyaz kenar çizgileri, asfalt, viraj kerbleri
        trackPath(ctx, 0, TRACK_N);
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 10.4; ctx.stroke();
        ctx.strokeStyle = '#2a2d33'; ctx.lineWidth = 8.8; ctx.stroke();
        for (let i = 0; i < TRACK_N; i++) {
            if (!TRACK.kerb[i]) continue;
            const j = (i + 1) % TRACK_N;
            for (const side of [4.9, -4.9]) {
                ctx.strokeStyle = (i >> 1) % 2 ? '#ef4444' : '#f8fafc'; ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(TRACK.x[i] + TRACK.nx[i] * side, TRACK.y[i] + TRACK.ny[i] * side);
                ctx.lineTo(TRACK.x[j] + TRACK.nx[j] * side, TRACK.y[j] + TRACK.ny[j] * side);
                ctx.stroke();
            }
        }

        // Geçilen sektör kendi renginde yanar
        for (let k = 0; k < 3; k++) {
            if (s.flash[k] <= 0) continue;
            trackPath(ctx, (k * TRACK_N) / 3, ((k + 1) * TRACK_N) / 3);
            ctx.strokeStyle = rgba(s.colors[k], 0.5 * s.flash[k]); ctx.lineWidth = 8.8; ctx.stroke();
        }

        // Hız verisiyle renklenen yarış çizgisi
        ctx.lineWidth = 1.2;
        for (let i = 0; i < TRACK_N; i += 4) {
            trackPath(ctx, i, i + 4);
            ctx.strokeStyle = rgba(telemetryColor(TRACK.spd[(i + 2) % TRACK_N]), 0.9); ctx.stroke();
        }

        // Start/finiş çizgisi (alt) ve sektör çizgileri
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 2; c++) {
                ctx.fillStyle = (r + c) % 2 ? '#0a0a0a' : '#f8fafc';
                ctx.fillRect(-2.2 + c * 2.2, TRACK.y[0] - 4.4 + r * 2.2, 2.2, 2.2);
            }
        }
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (const k of [TRACK_N / 3, (2 * TRACK_N) / 3]) {
            ctx.moveTo(TRACK.x[k] - TRACK.nx[k] * 5.5, TRACK.y[k] - TRACK.ny[k] * 5.5);
            ctx.lineTo(TRACK.x[k] + TRACK.nx[k] * 5.5, TRACK.y[k] + TRACK.ny[k] * 5.5);
        }
        ctx.stroke();

        const at = (q: number): [number, number] => {
            const f = (((q % 1) + 1) % 1) * TRACK_N, i = Math.floor(f), k = f - i, j = (i + 1) % TRACK_N;
            return [lerp(TRACK.x[i], TRACK.x[j], k), lerp(TRACK.y[i], TRACK.y[j], k)];
        };

        // Hayalet tur
        const gap = 0.022 * Math.sin(t * 0.37);
        const [gx, gy] = at(s.q + gap);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(gx, gy, 2.2, 0, TAU); ctx.fill(); ctx.stroke();

        // Sürücü ve izi
        ctx.lineCap = 'round';
        for (let j = 24; j > 0; j--) {
            const [x0, y0] = at(s.q - j * 0.0035), [x1, y1] = at(s.q - (j - 1) * 0.0035);
            ctx.strokeStyle = rgba(accent, (1 - j / 24) * 0.9); ctx.lineWidth = 3 * (1 - j / 30);
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        const [rx, ry] = at(s.q);
        ctx.globalCompositeOperation = 'lighter';
        bloom(ctx, rx, ry, 8, accent, 0.9);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = rgba(accent, 1);
        ctx.beginPath(); ctx.arc(rx, ry, 2.6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(rx, ry, 1.1, 0, TAU); ctx.fill();

        // Yayın etiketi: tur süresi ve hayalete göre fark
        if (showText(ctx)) {
            ctx.fillStyle = 'rgba(10,12,16,.92)'; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.roundRect(-36, 106, 72, 14, 7); ctx.fill(); ctx.stroke();
            ctx.fillStyle = rgba(accent, 1);
            ctx.beginPath(); ctx.roundRect(-36, 106, 4, 14, [7, 0, 0, 7]); ctx.fill();
            ctx.textBaseline = 'middle';
            ctx.font = '700 7px ui-monospace, SFMono-Regular, Menlo, monospace';
            ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
            ctx.fillText(fmtLap(s.lapT * (99.4 / LAP_SECONDS)), -29, 113.4);
            const delta = -gap * 18;
            ctx.font = '700 5px ui-monospace, SFMono-Regular, Menlo, monospace';
            ctx.textAlign = 'right'; ctx.fillStyle = delta <= 0 ? '#a855f7' : '#facc15';
            ctx.fillText(`${delta <= 0 ? '−' : '+'}${Math.abs(delta).toFixed(3)}`, 32, 113.4);
        }
    },
};

// ============================================================================
// RÜTBE ÇERÇEVELERİ — rütbe kariyer yolundaki 7 kademe için aynı ailenin giderek zenginleşen üyeleri.
// Malzeme: demir → bronz → gümüş → altın → platin + mine → obsidyen + altın + elmas → beyaz altın + alev.
// Her kademe bir öncekinin üzerine katman ekler: işleme, pusula uçları, mine, taşlar, kanat, taç, alev.
// ============================================================================

const METALS = {
    iron: ['#2b2e33', '#70757d', '#9da3ab', '#4b4f56', '#25282c'],
    bronze: ['#5a3413', '#c98a4b', '#f3c690', '#a5672c', '#6b3f18'],
    silver: ['#6f7780', '#e6ebf0', '#ffffff', '#aab3bd', '#78818b'],
    gold: GOLD_STOPS,
    platinum: ['#8a919a', '#f2f5f8', '#ffffff', '#c6ced7', '#959da6'],
    whiteGold: ['#c9a24a', '#fff1c4', '#ffffff', '#f3d98a', '#d6b25a'],
};

// Kademeye göre halkanın dış yarıçapı: rütbe yükseldikçe çerçeve kalınlaşır
const RANK_OUTER = [0, 82, 86, 89, 92, 95, 97, 98];

const metal = (ctx: CanvasRenderingContext2D, stops: string[], angle: number, repeat: number): CanvasGradient => {
    const n = stops.length;
    if (!ctx.createConicGradient) {
        const lin = ctx.createLinearGradient(-100, -100, 100, 100);
        stops.forEach((c, i) => lin.addColorStop(i / (n - 1), c));
        return lin;
    }
    const g = ctx.createConicGradient(angle, 0, 0);
    for (let r = 0; r < repeat; r++) {
        for (let i = 0; i < n; i++) g.addColorStop((r + i / n) / repeat, stops[i]);
    }
    g.addColorStop(1, stops[0]);
    return g;
};

const metalBand = (ctx: CanvasRenderingContext2D, r0: number, r1: number, stops: string[], angle: number, repeat: number, shade?: string) => {
    annulus(ctx, r0, r1); ctx.fillStyle = metal(ctx, stops, angle, repeat); ctx.fill();
    if (shade) { ctx.fillStyle = shade; ctx.fill(); }
};

const hairline = (ctx: CanvasRenderingContext2D, r: number, color: string, w = 0.6) => {
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
};

const sheen = (ctx: CanvasRenderingContext2D, r0: number, r1: number, angle: number, alpha: number, double = false) => {
    if (!ctx.createConicGradient) return;
    const g = ctx.createConicGradient(angle, 0, 0);
    for (const c of double ? [0.25, 0.75] : [0.5]) {
        g.addColorStop(c - 0.05, 'rgba(255,255,255,0)');
        g.addColorStop(c, `rgba(255,255,255,${alpha})`);
        g.addColorStop(c + 0.05, 'rgba(255,255,255,0)');
    }
    annulus(ctx, r0, r1); ctx.fillStyle = g; ctx.fill();
};

// Fasetli pusula ucu: bir yarısı aydınlık, diğeri gölgede
const spike = (ctx: CanvasRenderingContext2D, ang: number, r0: number, r1: number, half: number, light: string, dark: string) => {
    const tip = [r1 * Math.cos(ang), r1 * Math.sin(ang)], mid = [(r0 - 2) * Math.cos(ang), (r0 - 2) * Math.sin(ang)];
    for (const [side, fill] of [[-1, light], [1, dark]] as [number, string][]) {
        const b = ang + side * half;
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.lineTo(r0 * Math.cos(b), r0 * Math.sin(b)); ctx.lineTo(mid[0], mid[1]); ctx.closePath(); ctx.fill();
    }
};

const gem = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, light: string, dark: string, setting: string) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const d = (r: number) => { ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.closePath(); };
    ctx.fillStyle = setting; d(size + 1.1); ctx.fill();
    ctx.fillStyle = dark; d(size); ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(0, -size); ctx.lineTo(size, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath(); ctx.moveTo(-size * 0.5, -size * 0.1); ctx.lineTo(0, -size * 0.7); ctx.lineTo(size * 0.1, -size * 0.1); ctx.closePath(); ctx.fill();
    ctx.restore();
};

// Uygulamadaki rütbe rozetinde de bulunan dört köşeli pusula yıldızı
const compassStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fill: string, stroke: string) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const r = i % 2 ? size * 0.3 : size, a = (i / 8) * TAU - Math.PI / 2;
        ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 0.4; ctx.stroke();
};

// Alt ortadaki altıgen rütbe plakası: 2-4. kademede 1-3 şerit, 5-7. kademede 1-3 pusula yıldızı
const rankPlate = (ctx: CanvasRenderingContext2D, y: number, stops: string[], dark: string, chevrons: number, stars: number, starFill: string) => {
    const w = Math.max(chevrons, stars) === 3 ? 15.5 : 13;
    const g = ctx.createLinearGradient(0, y - 7, 0, y + 7);
    g.addColorStop(0, stops[2]); g.addColorStop(0.5, stops[1]); g.addColorStop(1, stops[0]);
    ctx.beginPath();
    ctx.moveTo(-w, y); ctx.lineTo(-w + 4, y - 7); ctx.lineTo(w - 4, y - 7); ctx.lineTo(w, y); ctx.lineTo(w - 4, y + 7); ctx.lineTo(-w + 4, y + 7);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 0.9; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineWidth = 1.5;
    for (let i = 0; i < chevrons; i++) {
        const yy = y + (i - (chevrons - 1) / 2) * 3.4;
        ctx.beginPath(); ctx.moveTo(-4.8, yy + 1.5); ctx.lineTo(0, yy - 1.5); ctx.lineTo(4.8, yy + 1.5); ctx.stroke();
    }
    for (let i = 0; i < stars; i++) compassStar(ctx, (i - (stars - 1) / 2) * 7.6, y, 3.6, starFill, dark);
};

// Katmanlı metal kanatlar: tüyler yukarı doğru süpürür, hafifçe nefes alır, üzerlerinden parlama dalgası geçer.
// Tüy boyu, kanat ucu canvas kenarını (±130) aşmayacak şekilde açıya göre sınırlanır.
const wings = (ctx: CanvasRenderingContext2D, t: number, stops: string[], tip: string, outline: string, layerCount: number) => {
    const layers: [number, number, number, number, number][] = [[8, 78, -72, 14, 0.24], [7, 58, -66, 10, 0.1], [6, 42, -58, 6, 0]];
    for (const side of [1, -1]) {
        ctx.save();
        ctx.scale(side, 1); ctx.translate(88, 32);
        layers.slice(3 - layerCount).forEach(([n, lmax, a0, a1, shade], li) => {
            for (let i = n - 1; i >= 0; i--) {
                const k = i / (n - 1);
                const ang = lerp(a0, a1, k) * DEG * (1 + 0.03 * Math.sin(t * 1.3)) + 0.02 * Math.sin(t * 1.3 + i * 0.6);
                const len = Math.min(lmax, 40 / Math.max(0.2, Math.cos(ang))) * (1 - 0.45 * k ** 1.5), w = len * 0.17;
                ctx.save();
                ctx.rotate(ang);
                const g = ctx.createLinearGradient(0, 0, len, 0);
                g.addColorStop(0, stops[0]); g.addColorStop(0.35, stops[1]); g.addColorStop(0.7, stops[2]); g.addColorStop(1, tip);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(len * 0.3, -w, len * 0.8, -w * 0.9, len, 0);
                ctx.bezierCurveTo(len * 0.75, w * 0.5, len * 0.3, w * 0.6, 0, 0);
                ctx.fillStyle = g; ctx.fill();
                if (shade) { ctx.fillStyle = `rgba(0,0,0,${shade})`; ctx.fill(); }
                const sh = Math.max(0, Math.sin(t * 2.2 - i * 0.55 - li)) ** 8;
                if (sh > 0.02) { ctx.fillStyle = `rgba(255,255,255,${0.5 * sh})`; ctx.fill(); }
                ctx.strokeStyle = outline; ctx.lineWidth = 0.5; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(len * 0.1, 0); ctx.lineTo(len * 0.9, -w * 0.12); ctx.stroke();
                ctx.restore();
            }
        });
        ctx.restore();
    }
};

// Halkayı saran, dalgalanan alev dilleri: dış katman tema renginden turuncuya, iç katman sarıdan beyaza
const flameCorona = (ctx: CanvasRenderingContext2D, t: number, r0: number, accent: RGB) => {
    const N = 30;
    const layers: [number, RGB, RGB, RGB, number][] = [[1, accent, [255, 120, 30], [255, 205, 90], 0], [0.6, [255, 150, 40], [255, 220, 120], [255, 250, 225], 1.7]];
    for (const [scale, c0, c1, c2, ph] of layers) {
        const g = ctx.createRadialGradient(0, 0, r0 - 2, 0, 0, r0 + 24 * scale);
        g.addColorStop(0, rgba(c0, 1)); g.addColorStop(0.5, rgba(c1, 1)); g.addColorStop(1, rgba(c2, 0.9));
        ctx.fillStyle = g;
        for (let i = 0; i < N; i++) {
            const a = (i / N) * TAU + ph * 0.1;
            const n = 0.5 + 0.25 * Math.sin(t * 5.1 + i * 2.3 + ph) + 0.25 * Math.sin(t * 8.7 + i * 4.1 + ph * 2);
            const vary = 0.7 + 0.3 * Math.abs(Math.sin(i * 12.9898));
            // Alev yukarı doğru daha uzun
            const h = (8 + 15 * n) * scale * vary * (0.75 + 0.45 * (0.5 - 0.5 * Math.sin(a)));
            const sway = 0.06 * Math.sin(t * 4 + i * 1.3), hw = 0.09 * scale;
            const pt = (r: number, an: number): [number, number] => [r * Math.cos(an), r * Math.sin(an)];
            const [bx0, by0] = pt(r0 - 2, a - hw), [bx1, by1] = pt(r0 - 2, a + hw), [tx, ty] = pt(r0 + h, a + sway);
            const [lx, ly] = pt(r0 + h * 0.45, a - hw * 1.25 + sway * 0.4), [rx, ry] = pt(r0 + h * 0.5, a + hw * 0.9 + sway * 0.6);
            ctx.beginPath();
            ctx.moveTo(bx0, by0); ctx.quadraticCurveTo(lx, ly, tx, ty); ctx.quadraticCurveTo(rx, ry, bx1, by1);
            ctx.closePath(); ctx.fill();
        }
    }
};

const crown = (ctx: CanvasRenderingContext2D, y: number, accent: RGB, t: number) => {
    ctx.save();
    ctx.translate(0, y); ctx.scale(1.22, 1.22);
    const g = ctx.createLinearGradient(-19, -20, 19, 4);
    g.addColorStop(0, '#fff6d0'); g.addColorStop(0.45, '#e9bd4e'); g.addColorStop(1, '#9a6c14');
    ctx.beginPath();
    ctx.moveTo(-17, 4); ctx.lineTo(-19, -12); ctx.lineTo(-13, -6); ctx.lineTo(-9.5, -16); ctx.lineTo(-5, -6.5); ctx.lineTo(0, -20);
    ctx.lineTo(5, -6.5); ctx.lineTo(9.5, -16); ctx.lineTo(13, -6); ctx.lineTo(19, -12); ctx.lineTo(17, 4);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(100,66,8,.85)'; ctx.lineWidth = 0.7; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = 'rgba(120,80,10,.35)'; ctx.fillRect(-17, 0, 34, 4);
    ctx.strokeStyle = 'rgba(255,250,220,.8)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-16.6, 0); ctx.lineTo(16.6, 0); ctx.stroke();
    for (const [x, yy] of [[-19, -12], [-9.5, -16], [0, -20], [9.5, -16], [19, -12]]) {
        ctx.fillStyle = '#fff3c4'; ctx.strokeStyle = 'rgba(100,66,8,.85)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.arc(x, yy, 1.7, 0, TAU); ctx.fill(); ctx.stroke();
    }
    bloom(ctx, 0, -4.5, 9, accent, 0.45 + 0.25 * Math.sin(t * 3));
    gem(ctx, 0, -4.5, 3.4, 0, rgba(mix(accent, WHITE, 0.35), 1), rgba(mix(accent, [0, 0, 0], 0.35), 1), '#7a5412');
    for (const x of [-10.5, 10.5]) gem(ctx, x, -2.2, 1.9, 0, '#f2faff', '#9fc4e6', '#7a5412');
    ctx.restore();
};

// Yörüngede dolaşan kuyruklu ışık
const comet = (ctx: CanvasRenderingContext2D, r: number, ang: number, dir: number, col: RGB, len: number, w: number) => {
    ctx.lineCap = 'butt';
    const N = 26;
    for (let i = N - 1; i >= 0; i--) {
        const d0 = (i / N) * len, d1 = ((i + 1.15) / N) * len;
        const k = 1 - i / N;
        ctx.strokeStyle = rgba(mix(col, WHITE, 0.5 * k * k), k * k);
        ctx.lineWidth = w * (0.3 + 0.7 * k);
        ctx.beginPath();
        if (dir > 0) ctx.arc(0, 0, r, ang - d1, ang - d0); else ctx.arc(0, 0, r, ang + d0, ang + d1);
        ctx.stroke();
    }
    bloom(ctx, r * Math.cos(ang), r * Math.sin(ang), w * 3.2, col, 0.95);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r * Math.cos(ang), r * Math.sin(ang), w * 0.55, 0, TAU); ctx.fill();
};

interface Mote { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number }
interface RankState { glints: Glint[]; next: number; embers: Mote[]; dust: Dust[]; shock: number; acc: number }

const GLINT_EVERY = [0, 0, 0, 1.8, 1, 0.6, 0.38, 0.2];
const EMBER_RATE = [0, 0, 0, 0, 0, 3, 7, 16];

const drawRank = (tier: number, s: RankState, { ctx, t, accent }: Env) => {
    const outer = RANK_OUTER[tier];
    const deep = mix(accent, [0, 0, 0], 0.62), hi = mix(accent, WHITE, 0.45);
    const GOLD_C: RGB = [255, 205, 90];

    // --- ARKA KATMANLAR ---
    if (tier === 7) {
        // Dönen ışık huzmeleri
        const rays: [number, number, RGB][] = [[129, 0.085, GOLD_C], [117, 0.06, accent]];
        const grads = rays.map(([R, , c]) => {
            const g = ctx.createRadialGradient(0, 0, 92, 0, 0, R);
            g.addColorStop(0, rgba(c, 0.8)); g.addColorStop(1, rgba(c, 0));
            return g;
        });
        ctx.save();
        ctx.rotate(t * 0.1);
        for (let i = 0; i < 18; i++) {
            const a = (i / 18) * TAU, [R, hw] = rays[i % 2];
            ctx.fillStyle = grads[i % 2];
            ctx.beginPath();
            ctx.moveTo(90 * Math.cos(a - hw * 0.5), 90 * Math.sin(a - hw * 0.5));
            ctx.lineTo(R * Math.cos(a - hw), R * Math.sin(a - hw));
            ctx.lineTo(R * Math.cos(a + hw), R * Math.sin(a + hw));
            ctx.lineTo(90 * Math.cos(a + hw * 0.5), 90 * Math.sin(a + hw * 0.5));
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    }
    if (tier >= 6) {
        // Nefes alan hale ve kanatlar
        const pulse = 0.75 + 0.25 * Math.sin(t * 1.8);
        const g = ctx.createRadialGradient(0, 0, outer - 4, 0, 0, outer + (tier === 7 ? 22 : 16));
        g.addColorStop(0, rgba(accent, 0.55 * pulse)); g.addColorStop(1, rgba(accent, 0));
        annulus(ctx, outer - 4, outer + 22); ctx.fillStyle = g; ctx.fill();
        if (tier === 7) wings(ctx, t, METALS.whiteGold, rgba(accent, 1), 'rgba(110,70,10,.55)', 3);
        else wings(ctx, t, METALS.gold, '#f3d572', 'rgba(70,45,5,.6)', 2);
    }
    if (tier === 7) flameCorona(ctx, t, outer, accent);

    // --- HALKA GÖVDESİ ---
    if (tier === 1) {
        // Mat demir: işleme yok, sadece dört perçin
        metalBand(ctx, 71.5, 82, METALS.iron, 0.6, 2, 'rgba(18,20,24,.38)');
        hairline(ctx, 72.2, 'rgba(255,255,255,.2)'); hairline(ctx, 81.7, 'rgba(0,0,0,.55)', 0.8);
        for (let i = 0; i < 4; i++) {
            const a = (45 + i * 90) * DEG, x = 76.8 * Math.cos(a), y = 76.8 * Math.sin(a);
            ctx.fillStyle = '#3a3d43'; ctx.beginPath(); ctx.arc(x, y, 1.7, 0, TAU); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(x - 0.5, y - 0.5, 0.6, 0, TAU); ctx.fill();
        }
        sheen(ctx, 71.5, 82, t * 0.35, 0.22);
    } else if (tier === 2) {
        // Bronz: pahlı gövde ve kazınmış çentikler
        metalBand(ctx, 82.5, 86, METALS.bronze, t * 0.25, 3);
        metalBand(ctx, 75, 82.5, METALS.bronze, -t * 0.15 + 1, 2, 'rgba(50,25,5,.28)');
        metalBand(ctx, 71.5, 75, METALS.bronze, t * 0.25 + 1.1, 3);
        hairline(ctx, 75, 'rgba(60,30,8,.65)'); hairline(ctx, 82.5, 'rgba(60,30,8,.65)');
        for (const [off, col] of [[0, 'rgba(60,30,8,.8)'], [0.012, 'rgba(255,225,180,.55)']] as [number, string][]) {
            ctx.strokeStyle = col; ctx.lineWidth = 0.9;
            ctx.beginPath();
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * TAU + off;
                ctx.moveTo(77 * Math.cos(a), 77 * Math.sin(a)); ctx.lineTo(80.5 * Math.cos(a), 80.5 * Math.sin(a));
            }
            ctx.stroke();
        }
        sheen(ctx, 71.5, 86, t * 0.6, 0.35);
    } else if (tier === 3) {
        // Gümüş: dönen pusula çizgileri ve dört ana yön ucu
        for (let i = 0; i < 4; i++) spike(ctx, i * Math.PI / 2 - Math.PI / 2, 88, 98, 3.4 * DEG, '#ffffff', '#8b949e');
        metalBand(ctx, 85.5, 89, METALS.silver, t * 0.3, 3);
        metalBand(ctx, 75, 85.5, METALS.silver, -t * 0.2 + 1, 2, 'rgba(40,48,58,.22)');
        metalBand(ctx, 71.5, 75, METALS.silver, t * 0.3 + 1.1, 3);
        hairline(ctx, 75, 'rgba(50,58,68,.6)'); hairline(ctx, 85.5, 'rgba(50,58,68,.6)');
        ctx.save();
        ctx.rotate(t * 0.12);
        ctx.strokeStyle = '#39414a';
        for (const major of [false, true]) {
            ctx.lineWidth = major ? 1.1 : 0.7;
            ctx.beginPath();
            for (let i = 0; i < 60; i++) {
                if ((i % 5 === 0) !== major) continue;
                const a = (i / 60) * TAU, r0 = major ? 77 : 78.2, r1 = major ? 83 : 81;
                ctx.moveTo(r0 * Math.cos(a), r0 * Math.sin(a)); ctx.lineTo(r1 * Math.cos(a), r1 * Math.sin(a));
            }
            ctx.stroke();
        }
        ctx.restore();
        sheen(ctx, 71.5, 89, t * 0.8, 0.5);
    } else if (tier === 4) {
        // Altın: akan rota çizgisi, yol noktası ve sekiz pusula ucu
        for (let i = 0; i < 8; i++) {
            const major = i % 2 === 0;
            spike(ctx, (i * Math.PI) / 4 - Math.PI / 2, 91, major ? 102 : 97, (major ? 3.6 : 2.6) * DEG, '#fff7d1', '#a87a1c');
        }
        metalBand(ctx, 88, 92, METALS.gold, t * 0.45, 3);
        metalBand(ctx, 76, 88, METALS.gold, -t * 0.3 + 1, 2, 'rgba(70,40,0,.2)');
        metalBand(ctx, 71.5, 76, METALS.gold, t * 0.45 + 1.1, 3);
        hairline(ctx, 76, 'rgba(70,45,5,.6)'); hairline(ctx, 88, 'rgba(70,45,5,.6)');
        hairline(ctx, 78.6, 'rgba(84,54,4,.5)', 0.5); hairline(ctx, 85.4, 'rgba(84,54,4,.5)', 0.5);
        ctx.setLineDash([4, 3]); ctx.lineDashOffset = -t * 9; ctx.lineCap = 'butt';
        hairline(ctx, 82, '#5b3d08', 1.7);
        ctx.setLineDash([]); ctx.lineDashOffset = 0;
        const wa = t * 0.9, wx = 82 * Math.cos(wa), wy = 82 * Math.sin(wa);
        bloom(ctx, wx, wy, 7, [255, 244, 200], 0.95);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(wx, wy, 1.3, 0, TAU); ctx.fill();
        sheen(ctx, 71.5, 92, t, 0.55, true);
    } else {
        // 5-7: değerli metal pahlar arasında mine ya da obsidyen kanal
        const bevel = tier === 5 ? METALS.platinum : tier === 6 ? METALS.gold : METALS.whiteGold;
        const in1 = tier === 6 ? 74.5 : tier === 7 ? 76.5 : 76, out0 = tier === 6 ? 94 : tier === 7 ? 90 : 89;
        if (tier === 5) {
            for (let i = 0; i < 8; i++) {
                const major = i % 2 === 0;
                spike(ctx, (i * Math.PI) / 4 - Math.PI / 2, 94, major ? 103.5 : 98.5, (major ? 3.6 : 2.6) * DEG, '#ffffff', '#8d96a0');
            }
        }
        metalBand(ctx, out0, outer, bevel, t * 0.5, 3);
        metalBand(ctx, 71.5, in1, bevel, t * 0.5 + 1.1, 3);

        const ch = ctx.createRadialGradient(0, 0, in1, 0, 0, out0);
        if (tier === 6) {
            ch.addColorStop(0, '#191a1f'); ch.addColorStop(0.5, '#050506'); ch.addColorStop(1, '#1d1e23');
        } else {
            ch.addColorStop(0, rgba(deep, 1)); ch.addColorStop(0.3, rgba(accent, 1)); ch.addColorStop(0.5, rgba(mix(accent, WHITE, 0.2), 1));
            ch.addColorStop(0.72, rgba(accent, 1)); ch.addColorStop(1, rgba(deep, 1));
        }
        annulus(ctx, in1, out0); ctx.fillStyle = ch; ctx.fill();
        const mid = (in1 + out0) / 2;

        if (tier >= 6) {
            // Birbirinin içinden geçen rozet dalgaları: obsidyende altın giyoş, minede akan plazma
            const amp = tier === 6 ? 5.6 : 4.4, lobes = tier === 6 ? 16 : 14, sp = tier === 6 ? 0.8 : 1.7;
            const cols = tier === 6 ? ['rgba(160,115,25,.85)', 'rgba(243,213,114,.8)'] : ['rgba(255,214,140,.85)', 'rgba(255,255,255,.55)'];
            ctx.lineWidth = tier === 6 ? 0.7 : 0.9;
            [1, -1].forEach((dir, di) => {
                for (const off of [0, Math.PI]) {
                    ctx.strokeStyle = cols[di];
                    ctx.beginPath();
                    for (let i = 0; i <= 360; i++) {
                        const a = (i / 360) * TAU, r = mid + amp * Math.sin(lobes * a + dir * t * sp + off);
                        i ? ctx.lineTo(r * Math.cos(a), r * Math.sin(a)) : ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
                    }
                    ctx.stroke();
                }
            });
        }
        if (tier === 6) { hairline(ctx, 77, 'rgba(217,167,51,.8)'); hairline(ctx, 91.5, 'rgba(217,167,51,.8)'); }
        if (tier !== 6) {
            // Mine parlaklığı ve içinde dolaşan enerji
            ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(0, 0, in1 + 3, 205 * DEG, 325 * DEG); ctx.stroke();
            if (tier === 5) comet(ctx, mid, t * 1.4, 1, hi, 1.5, 2.6);
        }
        hairline(ctx, in1, 'rgba(40,30,20,.7)'); hairline(ctx, out0, 'rgba(40,30,20,.7)');

        if (tier === 5) {
            // Altıgen cıvatalar: ışık sırayla üzerlerinden geçer
            const lit = Math.floor(t * 3) % 6;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU + Math.PI / 6, x = 92 * Math.cos(a), y = 92 * Math.sin(a);
                if (i === lit) bloom(ctx, x, y, 6, accent, 0.7);
                ctx.fillStyle = i === lit ? '#ffffff' : '#aeb6bf'; ctx.strokeStyle = '#4a525b'; ctx.lineWidth = 0.5;
                ctx.beginPath();
                for (let j = 0; j < 6; j++) ctx.lineTo(x + 2.3 * Math.cos(a + (j / 6) * TAU), y + 2.3 * Math.sin(a + (j / 6) * TAU));
                ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#4a525b'; ctx.beginPath(); ctx.arc(x, y, 0.8, 0, TAU); ctx.fill();
            }
            bloom(ctx, 0, -95.5, 10, accent, 0.5 + 0.3 * Math.sin(t * 3));
            gem(ctx, 0, -95.5, 4.4, 0, rgba(hi, 1), rgba(mix(accent, [0, 0, 0], 0.3), 1), '#5d656e');
        } else {
            // Taşlar: 6. kademede sekiz elmas, 7. kademede elmas ve yakut dönüşümlü on iki taş
            const n = tier === 6 ? 8 : 12, gr = tier === 6 ? 95.5 : 94;
            for (let i = 0; i < n; i++) {
                const a = (i / n) * TAU - Math.PI / 2;
                const ruby = tier === 7 && i % 2 === 1;
                gem(ctx, gr * Math.cos(a), gr * Math.sin(a), tier === 6 ? 2.6 : 3, a + Math.PI / 2,
                    ruby ? rgba(hi, 1) : '#f2faff', ruby ? rgba(mix(accent, [0, 0, 0], 0.3), 1) : '#9fc4e6', tier === 6 ? '#5b3d08' : '#8a6417');
                const hit = Math.max(0, Math.cos(a - t * 1.2)) ** 30;
                if (hit > 0.05) star(ctx, gr * Math.cos(a), gr * Math.sin(a), 4 + 8 * hit, t * 0.5, clamp(hit * 1.4));
            }
        }
        if (tier === 7 && ctx.createConicGradient) {
            // Beyaz altın üzerinde dönen gökkuşağı yansıması
            const pr = ctx.createConicGradient(-t * 0.4, 0, 0);
            ['255,80,80', '255,200,60', '90,230,140', '70,170,255', '190,110,255', '255,80,80'].forEach((c, i) => pr.addColorStop(i / 5, `rgba(${c},.22)`));
            for (const [a0, a1] of [[out0, outer], [71.5, in1]]) { annulus(ctx, a0, a1); ctx.fillStyle = pr; ctx.fill(); }
        }
        sheen(ctx, 71.5, outer, t * (tier === 7 ? 1.5 : 1.15), tier === 6 ? 0.45 : 0.6, true);
    }
    hairline(ctx, 71.8, 'rgba(0,0,0,.35)', 0.5);

    // --- RÜTBE PLAKASI, TAÇ, YÖRÜNGE IŞIKLARI ---
    if (tier >= 2) {
        const stops = [METALS.iron, METALS.iron, METALS.bronze, METALS.silver, METALS.gold, METALS.platinum, METALS.gold, METALS.whiteGold][tier];
        const dark = ['', '', '#4a2a0e', '#39414a', '#5b3d08', '#3d444c', '#3d2a05', '#6b4708'][tier];
        rankPlate(ctx, outer - 1, stops, dark, tier <= 4 ? tier - 1 : 0, tier >= 5 ? tier - 4 : 0, rgba(tier === 6 ? [20, 20, 24] : accent, 1));
    }
    if (tier === 7) crown(ctx, -outer - 3.5 + 1.1 * Math.sin(t * 1.6), accent, t);
    if (tier === 6) comet(ctx, outer + 4, t * 1.1, 1, GOLD_C, 1.3, 2.2);
    if (tier === 7) {
        comet(ctx, outer + 5, t * 1.3 + 1, 1, GOLD_C, 1.5, 2.6);
        comet(ctx, outer + 9, -t * 0.95, -1, accent, 1.3, 2.2);
        if (s.shock < 1) {
            const q = s.shock;
            ctx.strokeStyle = rgba(GOLD_C, (1 - q) * 0.8); ctx.lineWidth = 2.6 * (1 - q) + 0.4;
            ctx.beginPath(); ctx.arc(0, 0, 100 + 28 * (1 - (1 - q) * (1 - q)), 0, TAU); ctx.stroke();
        }
    }

    // --- PARILTI, KOR VE ALTIN TOZU ---
    for (const g of s.glints) {
        const q = Math.sin(Math.PI * (g.age / g.life));
        star(ctx, g.r * Math.cos(g.a), g.r * Math.sin(g.a), g.size * q, g.age * 1.6, q);
    }
    for (const p of s.embers) {
        const k = clamp(p.life / p.max);
        ctx.fillStyle = rgba(mix(accent, GOLD_C, k), Math.min(1, k * 1.6));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * k), 0, TAU); ctx.fill();
    }
    for (const d of s.dust) {
        const tw = 0.5 + 0.5 * Math.sin(t * 2.4 + d.ph);
        ctx.fillStyle = rgba(GOLD_DUST, 0.25 + 0.7 * tw);
        ctx.beginPath(); ctx.arc(d.r * Math.cos(d.a), d.r * Math.sin(d.a) + 2 * Math.sin(t + d.ph), d.size * (0.7 + 0.5 * tw), 0, TAU); ctx.fill();
    }
};

const rankFrame = (tier: number): FrameDef<RankState> => ({
    init: ({ rnd }) => ({
        glints: [], next: 1, embers: [], shock: 9, acc: 0,
        dust: tier < 6 ? [] : Array.from({ length: tier === 7 ? 34 : 20 }, () => ({
            a: rnd() * TAU, r: 104 + rnd() * 22, w: (0.08 + rnd() * 0.2) * (rnd() < 0.5 ? 1 : -1), ph: rnd() * TAU, size: 0.5 + rnd() * 0.9,
        })),
    }),
    step: (s, { dt, rnd }) => {
        const outer = RANK_OUTER[tier];
        if (GLINT_EVERY[tier] && (s.next -= dt) <= 0) {
            s.next = GLINT_EVERY[tier] * (0.6 + rnd() * 0.8);
            s.glints.push({ a: rnd() * TAU, r: 74 + rnd() * (outer - 76), age: 0, life: 0.55 + rnd() * 0.4, size: 4 + rnd() * (tier >= 6 ? 7 : 5) });
        }
        for (const g of s.glints) g.age += dt;
        s.glints = s.glints.filter(g => g.age < g.life);

        s.acc += dt * EMBER_RATE[tier];
        while (s.acc >= 1) {
            s.acc -= 1;
            const a = rnd() * TAU, r = outer + rnd() * 6, max = 1.2 + rnd() * 1.2;
            s.embers.push({ x: r * Math.cos(a), y: r * Math.sin(a), vx: (rnd() - 0.5) * 14, vy: -10 - rnd() * 22, life: max, max, size: 0.6 + rnd() * 1 });
        }
        for (const p of s.embers) { p.x += (p.vx + 6 * Math.sin(p.life * 5)) * dt; p.y += p.vy * dt; p.life -= dt; }
        s.embers = s.embers.filter(p => p.life > 0 && p.y > -130);

        if (tier === 7) {
            s.shock += dt / 0.8;
            if (s.shock > 5.5) s.shock = 0;
        }
        for (const d of s.dust) d.a += d.w * dt;
    },
    draw: (s, env) => drawRank(tier, s, env),
});

const RANK_IDS = ['rank-rookie', 'rank-street', 'rank-explorer', 'rank-commander', 'rank-master', 'rank-elite', 'rank-legend'] as const;

// ============================================================================
// KONVOY LİDERİ — 10 arkadaşını davet edip kayıt yaptıranlara özel.
// Siyah krom gövde ve şampanya altını pahlar; halkada her arkadaş için bir far yuvası yanar.
// Tema renginde lider (kullanıcı) önde, 10 sürücü zikzak düzende arkasından gelir.
// Birkaç saniyede bir bütün farlar sırayla selektör yapar ve dışa ışık dalgası yayılır.
// env.level (0-10): kaç arkadaşın katıldığı; 10'un altında çerçeve ilerleme önizlemesi olarak çizilir.
// ============================================================================

const CHAMPAGNE = ['#6e5530', '#d9c08f', '#fff4dc', '#b89c6a', '#7a6038'];
const BLACK_CHROME = ['#0b0c0f', '#3a3f48', '#a7b0ba', '#22262d', '#08090b'];
const HEADLIGHT: RGB = [255, 244, 214];
const TAILLIGHT: RGB = [255, 40, 40];
const CONVOY_SLOTS = 10;
const CONVOY_LANE = 82.5;
const SOCKET_R = 92;
const SALUTE_EVERY = 5.5;

// Yuvalar tepedeki armanın iki yanından başlar
const socketAngle = (k: number) => -Math.PI / 2 + ((k + 0.5) / CONVOY_SLOTS) * TAU;
const angGap = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

const convoy: FrameDef<{ lead: number; salute: number; dust: Dust[] }> = {
    init: ({ rnd }) => ({
        lead: -Math.PI / 2, salute: 1.2,
        dust: Array.from({ length: 26 }, () => ({
            a: rnd() * TAU, r: 104 + rnd() * 20, w: (0.06 + rnd() * 0.18) * (rnd() < 0.5 ? 1 : -1), ph: rnd() * TAU, size: 0.5 + rnd() * 0.9,
        })),
    }),
    step: (s, { dt, t }) => {
        s.lead += (0.85 + 0.15 * Math.sin(t * 0.6)) * dt;
        s.salute = (s.salute + dt) % SALUTE_EVERY;
        for (const d of s.dust) d.a += d.w * dt;
    },
    draw: (s, { ctx, t, accent, level }) => {
        const lit = Math.max(0, Math.min(CONVOY_SLOTS, Math.round(level)));
        const full = lit === CONVOY_SLOTS;
        const warm = mix(accent, [255, 214, 140], 0.45);
        const beam = mix(HEADLIGHT, accent, 0.22);

        // Selektör: farlar sırayla 0.09 sn arayla yanar, ardından dışa dalga
        const saluteOf = (k: number) => {
            const d = s.salute - k * 0.09;
            return d > 0 && d < 0.35 ? Math.sin((Math.PI * d) / 0.35) : 0;
        };
        const wave = (s.salute - 1) / 0.9;

        // Yanan yuvalardan dışa vuran far huzmeleri
        for (let k = 0; k < lit; k++) {
            const a = socketAngle(k), hw = 0.07, f = saluteOf(k);
            const g = ctx.createRadialGradient(0, 0, 96, 0, 0, 124 + 4 * f);
            g.addColorStop(0, rgba(warm, 0.32 + 0.5 * f)); g.addColorStop(1, rgba(warm, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(96 * Math.cos(a - hw * 0.4), 96 * Math.sin(a - hw * 0.4));
            ctx.lineTo(124 * Math.cos(a - hw), 124 * Math.sin(a - hw));
            ctx.lineTo(124 * Math.cos(a + hw), 124 * Math.sin(a + hw));
            ctx.lineTo(96 * Math.cos(a + hw * 0.4), 96 * Math.sin(a + hw * 0.4));
            ctx.closePath(); ctx.fill();
        }
        if (full) {
            const g = ctx.createRadialGradient(0, 0, 96, 0, 0, 116);
            g.addColorStop(0, rgba(accent, 0.22 + 0.08 * Math.sin(t * 1.7))); g.addColorStop(1, rgba(accent, 0));
            annulus(ctx, 96, 116); ctx.fillStyle = g; ctx.fill();
        }

        // Gövde: şampanya altını iç pah, siyah krom gövde, şampanya altını dış pah, tırtıllı siyah krom dudak
        metalBand(ctx, 96.5, 100, BLACK_CHROME, -t * 0.4, 4);
        ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 0; i < 120; i++) {
            const a = (i / 120) * TAU;
            ctx.moveTo(97 * Math.cos(a), 97 * Math.sin(a)); ctx.lineTo(99.5 * Math.cos(a), 99.5 * Math.sin(a));
        }
        ctx.stroke();
        metalBand(ctx, 89.5, 96.5, CHAMPAGNE, t * 0.45, 3);
        metalBand(ctx, 75, 89.5, BLACK_CHROME, t * 0.3 + 0.8, 3);
        metalBand(ctx, 71.5, 75, CHAMPAGNE, t * 0.45 + 1.1, 3);
        for (const [r, c] of [[75, 'rgba(40,30,15,.75)'], [89.5, 'rgba(40,30,15,.75)'], [96.5, 'rgba(0,0,0,.6)']] as [number, string][]) hairline(ctx, r, c, 0.7);

        // Konvoy şeridi: gövdeye gömülü koyu kanal ve ortasında tema renginde ince çizgi
        annulus(ctx, 78.6, 86.4); ctx.fillStyle = 'rgba(3,4,6,.88)'; ctx.fill();
        hairline(ctx, 78.6, 'rgba(255,255,255,.14)', 0.4); hairline(ctx, 86.4, 'rgba(255,255,255,.14)', 0.4);
        ctx.setLineDash([2.2, 2.6]); ctx.lineDashOffset = -t * 6;
        hairline(ctx, CONVOY_LANE, rgba(accent, full ? 0.55 : 0.3), 0.5);
        ctx.setLineDash([]); ctx.lineDashOffset = 0;

        // Yanan komşu yuvalar arasında akan enerji
        ctx.lineCap = 'round';
        for (let k = 0; k < lit - 1 + (full ? 1 : 0); k++) {
            const a0 = socketAngle(k), a1 = socketAngle(k + 1);
            ctx.strokeStyle = rgba(accent, 0.45); ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.arc(0, 0, SOCKET_R, a0 + 0.09, a1 - 0.09); ctx.stroke();
            const ph = (t * 0.7 + k * 0.37) % 1, pa = lerp(a0 + 0.09, a1 - 0.09, ph);
            bloom(ctx, SOCKET_R * Math.cos(pa), SOCKET_R * Math.sin(pa), 3.2, mix(accent, WHITE, 0.4), Math.sin(Math.PI * ph));
        }

        // Konvoy: lider önde, katılan arkadaşlar zikzak düzende arkasında; her birinin stop izi
        const rider = (ang: number, r: number, head: RGB, size: number, trail: number) => {
            for (let i = 0; i < 10; i++) {
                const a0 = ang - 0.02 - i * trail / 10, a1 = a0 - trail / 10;
                ctx.strokeStyle = rgba(TAILLIGHT, (1 - i / 10) * 0.85); ctx.lineWidth = size * 0.7 * (1 - i / 14);
                ctx.beginPath(); ctx.arc(0, 0, r, a1, a0); ctx.stroke();
            }
            ctx.globalCompositeOperation = 'lighter';
            bloom(ctx, r * Math.cos(ang + 0.03), r * Math.sin(ang + 0.03), size * 3, head, 0.95);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(r * Math.cos(ang), r * Math.sin(ang), size * 0.45, 0, TAU); ctx.fill();
        };
        ctx.save();
        annulus(ctx, 78.8, 86.2); ctx.clip();
        ctx.lineCap = 'butt';
        for (let i = lit; i >= 1; i--) {
            const ang = s.lead - i * 0.235 + 0.02 * Math.sin(t * 2.2 + i);
            rider(ang, CONVOY_LANE + (i % 2 ? 1.9 : -1.9), HEADLIGHT, 1.9, 0.16);
        }
        rider(s.lead, CONVOY_LANE, accent, 2.6, 0.3);
        ctx.restore();

        // Far yuvaları: yanan yuva cam far, sönük yuva koyu cam; lider geçerken ve selektörde parlar
        for (let k = 0; k < CONVOY_SLOTS; k++) {
            const a = socketAngle(k), x = SOCKET_R * Math.cos(a), y = SOCKET_R * Math.sin(a);
            const on = k < lit;
            const pass = on ? Math.exp(-((angGap(a, s.lead) / 0.16) ** 2)) : 0;
            const f = on ? saluteOf(k) : 0;
            ctx.fillStyle = '#16181c';
            ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
            const rim = ctx.createLinearGradient(x - 5, y - 5, x + 5, y + 5);
            rim.addColorStop(0, '#fff4dc'); rim.addColorStop(0.5, '#b89c6a'); rim.addColorStop(1, '#6e5530');
            ctx.strokeStyle = rim; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(x, y, 4.6, 0, TAU); ctx.stroke();
            if (on) {
                ctx.globalCompositeOperation = 'lighter';
                bloom(ctx, x, y, 9 + 6 * pass + 10 * f, beam, 0.55 + 0.35 * pass + 0.45 * f);
                ctx.globalCompositeOperation = 'source-over';
                const lens = ctx.createRadialGradient(x - 1, y - 1, 0.3, x, y, 3.9);
                lens.addColorStop(0, '#ffffff'); lens.addColorStop(0.55, rgba(HEADLIGHT, 1)); lens.addColorStop(1, '#f2d9a6');
                ctx.fillStyle = lens;
            } else {
                const lens = ctx.createRadialGradient(x - 1.2, y - 1.2, 0.2, x, y, 3.9);
                lens.addColorStop(0, 'rgba(255,255,255,.35)'); lens.addColorStop(0.35, '#2a2e35'); lens.addColorStop(1, '#0c0d10');
                ctx.fillStyle = lens;
            }
            ctx.beginPath(); ctx.arc(x, y, 3.9, 0, TAU); ctx.fill();
            ctx.strokeStyle = on ? rgba(accent, 1) : 'rgba(255,255,255,.12)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(x, y, 3.9, 0, TAU); ctx.stroke();
            if (f > 0.6) star(ctx, x, y, 7 + 9 * f, t, f);
        }

        // Selektör dalgası
        if (full && wave > 0 && wave < 1) {
            ctx.strokeStyle = rgba(warm, (1 - wave) * 0.85); ctx.lineWidth = 2.4 * (1 - wave) + 0.4;
            ctx.beginPath(); ctx.arc(0, 0, 100 + 27 * (1 - (1 - wave) * (1 - wave)), 0, TAU); ctx.stroke();
        }

        // Arma: şampanya altını kalkan, siyah krom iç yüzey, katılan arkadaş sayısı ve tema renginde taş
        ctx.save();
        ctx.translate(0, -101.5 + 0.8 * Math.sin(t * 1.5));
        const shield = (w: number, h: number) => {
            ctx.beginPath();
            ctx.moveTo(-w, -h * 0.55);
            ctx.quadraticCurveTo(0, -h * 0.8, w, -h * 0.55);
            ctx.lineTo(w, h * 0.05);
            ctx.quadraticCurveTo(w * 0.85, h * 0.65, 0, h);
            ctx.quadraticCurveTo(-w * 0.85, h * 0.65, -w, h * 0.05);
            ctx.closePath();
        };
        const gold = ctx.createLinearGradient(-11, -12, 11, 12);
        gold.addColorStop(0, '#fff4dc'); gold.addColorStop(0.45, '#d9c08f'); gold.addColorStop(1, '#6e5530');
        if (full) { ctx.globalCompositeOperation = 'lighter'; bloom(ctx, 0, 0, 20, accent, 0.45 + 0.2 * Math.sin(t * 2)); ctx.globalCompositeOperation = 'source-over'; }
        shield(11, 13); ctx.fillStyle = gold; ctx.fill();
        ctx.strokeStyle = 'rgba(60,45,20,.9)'; ctx.lineWidth = 0.6; ctx.stroke();
        const inner = ctx.createLinearGradient(-8, -9, 8, 10);
        inner.addColorStop(0, '#3a3f48'); inner.addColorStop(0.5, '#0b0c0f'); inner.addColorStop(1, '#22262d');
        shield(8.4, 10.2); ctx.fillStyle = inner; ctx.fill();
        ctx.font = `italic 900 ${lit === CONVOY_SLOTS ? 9.5 : 10}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = full ? gold : 'rgba(217,192,143,.75)';
        ctx.fillText(String(lit), 0, -1.6);
        gem(ctx, 0, 6.6, 1.9, 0, rgba(mix(accent, WHITE, 0.35), 1), rgba(mix(accent, [0, 0, 0], 0.35), 1), '#6e5530');
        for (const side of [-1, 1]) {
            ctx.strokeStyle = gold; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(side * (12.5 + i * 2.6), -5 + i * 2.2);
                ctx.lineTo(side * (16.5 + i * 3), -3.2 + i * 2.6);
                ctx.stroke();
            }
        }
        ctx.restore();

        sheen(ctx, 71.5, 100, t * 1.05, 0.38, true);

        // Altın tozu (tam açıldığında)
        if (full) {
            for (const d of s.dust) {
                const tw = 0.5 + 0.5 * Math.sin(t * 2.4 + d.ph);
                ctx.fillStyle = rgba(mix(accent, [214, 192, 143], 0.5), 0.25 + 0.7 * tw);
                ctx.beginPath(); ctx.arc(d.r * Math.cos(d.a), d.r * Math.sin(d.a) + 2 * Math.sin(t + d.ph), d.size * (0.7 + 0.5 * tw), 0, TAU); ctx.fill();
            }
        }
        hairline(ctx, 71.8, 'rgba(0,0,0,.35)', 0.5);
    },
};

// ============================================================================
// YOL HİKÂYECİSİ — 10 paylaşım yapanlara özel.
// Profil fotoğrafının çevresinde dönen 35 mm film şeridi: her paylaşım bir kareyi yol sahnesiyle doldurur.
// Tepede objektif rozeti; birkaç saniyede bir flaş patlar ve dolu karelerden beğeni kalpleri yükselir.
// env.level (0-10): paylaşım sayısı; 10'un altında boş kareler negatif film olarak kalır.
// ============================================================================

const STORY_CELLS = 10;
const STORY_FLASH_EVERY = 5.5;

// Kare sahneleri: gökyüzü üst, gökyüzü ufuk, dağ, yol rengi, güneş/ay
const STORY_SCENES: [string, string, string, string, string][] = [
    ['#ff7a59', '#ffd18a', '#5b2a4a', '#2b2230', '#fff1c4'], // gün batımı
    ['#3d8bfd', '#bfe3ff', '#4f6b5a', '#3a3d42', '#fffbe8'], // öğle
    ['#0b1640', '#3a3f8f', '#141a3a', '#16171c', '#e8ecff'], // gece
    ['#6b4aa8', '#ffb37a', '#3b2f5c', '#2a2633', '#ffe3a8'], // şafak
    ['#e0a04a', '#ffe2a6', '#a8642c', '#5a4632', '#fff6dc'], // çöl
];

interface Heart { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; rot: number }

const heartPath = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.bezierCurveTo(-1.6, -0.1, -1.1, -1.6, 0, -0.75);
    ctx.bezierCurveTo(1.1, -1.6, 1.6, -0.1, 0, 1);
    ctx.closePath();
    ctx.restore();
};

const storyScene = (ctx: CanvasRenderingContext2D, k: number, t: number) => {
    const [skyTop, skyLow, hill, road, orb] = STORY_SCENES[k % STORY_SCENES.length];
    const sky = ctx.createLinearGradient(0, -8, 0, 2);
    sky.addColorStop(0, skyTop); sky.addColorStop(1, skyLow);
    ctx.fillStyle = sky; ctx.fillRect(-21, -8, 42, 16);
    const night = k % STORY_SCENES.length === 2;
    if (night) {
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        for (let i = 0; i < 9; i++) ctx.fillRect(-19 + ((i * 37) % 38), -7 + ((i * 13) % 6), 0.5, 0.5);
    }
    ctx.fillStyle = orb;
    ctx.beginPath(); ctx.arc(8 - (k % 3) * 7, -3.5 + (k % 2), night ? 1.6 : 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = hill;
    ctx.beginPath(); ctx.moveTo(-21, 1);
    for (let x = -21; x <= 21; x += 3) ctx.lineTo(x, -0.5 - 2.6 * Math.abs(Math.sin(x * 0.18 + k * 1.7)));
    ctx.lineTo(21, 8); ctx.lineTo(-21, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = road;
    ctx.beginPath(); ctx.moveTo(-1, 0.6); ctx.lineTo(1, 0.6); ctx.lineTo(9, 8); ctx.lineTo(-9, 8); ctx.closePath(); ctx.fill();
    // Akan şerit çizgileri: sahne canlı bir yol görüntüsü gibi akar
    ctx.fillStyle = 'rgba(255,240,190,.9)';
    for (let i = 0; i < 3; i++) {
        const q = (i / 3 + t * 0.6) % 1, y = 1 + 7 * q * q, w = 0.25 + 0.6 * q;
        ctx.fillRect(-w / 2, y, w, 0.5 + 1.6 * q);
    }
};

const storyteller: FrameDef<{ flash: number; hearts: Heart[]; fired: boolean }> = {
    init: () => ({ flash: 1.4, hearts: [], fired: false }),
    step: (s, { dt, rnd, level, t }) => {
        const prev = s.flash;
        s.flash = (s.flash + dt) % STORY_FLASH_EVERY;
        const lit = Math.max(0, Math.min(STORY_CELLS, Math.round(level)));
        if (s.flash < prev && lit > 0) {
            // Flaş: dolu karelerden kalpler yükselir
            const film = t * 0.12;
            for (let i = 0; i < 4 + lit; i++) {
                const k = Math.floor(rnd() * lit), a = film + ((k + 0.5) / STORY_CELLS) * TAU - Math.PI / 2;
                const r = 96 + rnd() * 3, max = 1.3 + rnd() * 0.8;
                s.hearts.push({ x: r * Math.cos(a), y: r * Math.sin(a), vx: Math.cos(a) * 18 + (rnd() - 0.5) * 12, vy: Math.sin(a) * 18 - 22 - rnd() * 14, life: max, max, size: 2.2 + rnd() * 1.8, rot: (rnd() - 0.5) * 0.6 });
            }
        }
        for (const h of s.hearts) {
            h.x += (h.vx + 6 * Math.sin(h.life * 4)) * dt; h.y += h.vy * dt;
            h.vx *= 1 - 1.2 * dt; h.vy = h.vy * (1 - 1.2 * dt) - 8 * dt;
            h.life -= dt;
        }
        s.hearts = s.hearts.filter(h => h.life > 0);
    },
    draw: (s, { ctx, t, accent, level }) => {
        const lit = Math.max(0, Math.min(STORY_CELLS, Math.round(level)));
        const full = lit === STORY_CELLS;
        const film = t * 0.12;
        const flashK = s.flash < 0.35 ? 1 - s.flash / 0.35 : 0;

        if (full) {
            const g = ctx.createRadialGradient(0, 0, 96, 0, 0, 114);
            g.addColorStop(0, rgba(accent, 0.22 + 0.06 * Math.sin(t * 1.6))); g.addColorStop(1, rgba(accent, 0));
            annulus(ctx, 96, 114); ctx.fillStyle = g; ctx.fill();
        }

        // Film şeridi: siyah taban, iki kenarda dönen tırnak delikleri
        annulus(ctx, 71.5, 100); ctx.fillStyle = '#111215'; ctx.fill();
        ctx.save();
        ctx.rotate(film);
        ctx.fillStyle = 'rgba(245,240,228,.85)';
        for (const [r, n] of [[74.6, 40], [96.6, 52]] as [number, number][]) {
            for (let i = 0; i < n; i++) {
                const a = (i / n) * TAU;
                ctx.save(); ctx.rotate(a); ctx.translate(r, 0);
                ctx.beginPath(); ctx.roundRect(-1.1, -1.5, 2.2, 3, 0.6); ctx.fill();
                ctx.restore();
            }
        }

        // Kareler: dolu kare yol sahnesi, boş kare turuncu negatif film
        for (let k = 0; k < STORY_CELLS; k++) {
            const a = ((k + 0.5) / STORY_CELLS) * TAU - Math.PI / 2;
            ctx.save();
            ctx.rotate(a); ctx.translate(86, 0); ctx.rotate(Math.PI / 2);
            ctx.beginPath(); ctx.roundRect(-21, -8, 42, 16, 1.6);
            ctx.save(); ctx.clip();
            if (k < lit) {
                storyScene(ctx, k, t + k * 0.13);
                const vg = ctx.createRadialGradient(0, 0, 6, 0, 0, 24);
                vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
                ctx.fillStyle = vg; ctx.fillRect(-21, -8, 42, 16);
                if (flashK > 0) { ctx.fillStyle = `rgba(255,255,255,${0.75 * flashK})`; ctx.fillRect(-21, -8, 42, 16); }
            } else {
                ctx.fillStyle = '#3a2412'; ctx.fillRect(-21, -8, 42, 16);
                ctx.strokeStyle = 'rgba(255,170,90,.25)'; ctx.lineWidth = 0.6;
                ctx.beginPath(); ctx.moveTo(-21, 3); ctx.lineTo(21, -1); ctx.stroke();
                ctx.fillStyle = 'rgba(255,190,120,.35)';
                ctx.font = '700 4px ui-monospace, SFMono-Regular, Menlo, monospace';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(String(k + 1).padStart(2, '0'), 0, 0.4);
            }
            ctx.restore();
            ctx.strokeStyle = k < lit ? rgba(mix(accent, WHITE, 0.25), 0.9) : 'rgba(255,255,255,.12)';
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.roundRect(-21, -8, 42, 16, 1.6); ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        // Kenar çizgileri ve parlama
        hairline(ctx, 72, 'rgba(255,255,255,.25)', 0.5);
        hairline(ctx, 99.6, 'rgba(255,255,255,.25)', 0.5);
        sheen(ctx, 71.5, 100, t * 0.9, 0.22, true);

        // Flaş: tüm halka beyaz parlar
        if (flashK > 0) {
            ctx.globalCompositeOperation = 'lighter';
            bloom(ctx, 0, -101, 36 * flashK + 8, WHITE, 0.9 * flashK);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Objektif rozeti: gümüş gövde, dönen diyafram kanatları, tema renginde lens yansıması, paylaşım sayısı
        ctx.save();
        ctx.translate(0, -101);
        const body = ctx.createLinearGradient(-11, -11, 11, 11);
        body.addColorStop(0, '#f4f6f8'); body.addColorStop(0.5, '#8d96a0'); body.addColorStop(1, '#e2e6ea');
        ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(30,34,40,.8)'; ctx.lineWidth = 0.6; ctx.stroke();
        ctx.fillStyle = '#0d0e11'; ctx.beginPath(); ctx.arc(0, 0, 8.6, 0, TAU); ctx.fill();
        // Diyafram: flaşta kapanıp açılır
        const open = 5.2 - 3.4 * flashK;
        ctx.save();
        ctx.beginPath(); ctx.arc(0, 0, 8.4, 0, TAU); ctx.clip();
        ctx.rotate(t * 0.3);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU;
            ctx.fillStyle = i % 2 ? '#2b2f36' : '#353a42';
            ctx.beginPath();
            ctx.moveTo(open * Math.cos(a), open * Math.sin(a));
            ctx.lineTo(10 * Math.cos(a - 0.5), 10 * Math.sin(a - 0.5));
            ctx.lineTo(10 * Math.cos(a + 0.9), 10 * Math.sin(a + 0.9));
            ctx.lineTo(open * Math.cos(a + TAU / 6), open * Math.sin(a + TAU / 6));
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        const glass = ctx.createRadialGradient(-1.5, -1.5, 0.3, 0, 0, open);
        glass.addColorStop(0, rgba(mix(accent, WHITE, 0.6), 1)); glass.addColorStop(0.5, rgba(accent, 0.9)); glass.addColorStop(1, '#0b0c10');
        ctx.fillStyle = glass; ctx.beginPath(); ctx.arc(0, 0, open, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `900 ${lit === STORY_CELLS ? 5.6 : 6}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(lit), 0, 0.4);
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        ctx.beginPath(); ctx.ellipse(-4.2, -5.2, 2.2, 1, -0.6, 0, TAU); ctx.fill();
        // Flaş lambası
        ctx.fillStyle = flashK > 0 ? '#ffffff' : '#c9d0d8';
        ctx.beginPath(); ctx.roundRect(7, -13, 6, 3.4, 1); ctx.fill();
        ctx.restore();

        // Beğeni kalpleri
        for (const h of s.hearts) {
            const k = clamp(h.life / h.max), grow = clamp((h.max - h.life) / 0.25);
            heartPath(ctx, h.x, h.y, h.size * (0.6 + 0.4 * grow), h.rot);
            ctx.fillStyle = rgba(accent, Math.min(1, k * 1.5));
            ctx.fill();
            ctx.strokeStyle = `rgba(255,255,255,${0.7 * k})`; ctx.lineWidth = 0.3; ctx.stroke();
        }
        hairline(ctx, 71.8, 'rgba(0,0,0,.35)', 0.5);
    },
};

// ============================================================================
// BİN KİLOMETRE — 1000 km yol katedenlere özel.
// Gece mavisi mine ve altın pahlar; minede harita kontur çizgileri akar. Halkada kıvrılan altın rotada
// her 100 km'de bir kilometre taşı durur; tema renginde sürücü rotada ilerler, geçtiği taş parlar.
// Altta mekanik kilometre sayacı birkaç saniyede bir 0999'dan 1000'e döner: altın patlama ve şok dalgası.
// env.level (0-10): katedilen yol / 100 km; 10'un altında taşlar ve rota o kadarıyla yanar.
// ============================================================================

const KM_STONES = 10;
const KM_CYCLE = 7;
const KM_ROLL_AT = 3.2;
const ROUTE_R = 85;
const KM_GOLD: RGB = [255, 210, 110];

const routeR = (a: number) => ROUTE_R + 3.1 * Math.sin(5 * a + 0.6) + 1.4 * Math.sin(11 * a + 1.3);
// Rota tepeden başlar, saat yönünde ilerler; taşlar armanın iki yanından başlar
const routeAngle = (q: number) => -Math.PI / 2 + q * TAU;
const routePt = (q: number): [number, number] => { const a = routeAngle(q), r = routeR(a); return [r * Math.cos(a), r * Math.sin(a)]; };

interface KmSpark { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number }

const kilometre: FrameDef<{ cyc: number; ride: number; burst: KmSpark[]; dust: Dust[] }> = {
    init: ({ rnd }) => ({
        cyc: 0.4, ride: 0, burst: [],
        dust: Array.from({ length: 30 }, () => ({
            a: rnd() * TAU, r: 104 + rnd() * 22, w: (0.06 + rnd() * 0.18) * (rnd() < 0.5 ? 1 : -1), ph: rnd() * TAU, size: 0.5 + rnd() * 1,
        })),
    }),
    step: (s, { dt, rnd, level }) => {
        const prev = s.cyc;
        s.cyc = (s.cyc + dt) % KM_CYCLE;
        const progress = clamp(level / KM_STONES);
        s.ride = (s.ride + dt * 0.11) % 1;
        if (progress < 1) s.ride = Math.min(s.ride, progress);
        if (progress >= 1 && prev < KM_ROLL_AT + 0.45 && s.cyc >= KM_ROLL_AT + 0.45) {
            for (let i = 0; i < 70; i++) {
                const a = (-0.5 + (rnd() - 0.5) * 1.6) * Math.PI, v = 40 + rnd() * 110, max = 0.8 + rnd() * 0.9;
                s.burst.push({ x: (rnd() - 0.5) * 16, y: 96, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max, size: 0.6 + rnd() * 1.2 });
            }
        }
        for (const p of s.burst) { p.vy += 90 * dt; p.vx *= 1 - 1.4 * dt; p.vy *= 1 - 1.4 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
        s.burst = s.burst.filter(p => p.life > 0);
        for (const d of s.dust) d.a += d.w * dt;
    },
    draw: (s, { ctx, t, accent, level }) => {
        const lit = Math.max(0, Math.min(KM_STONES, Math.round(level)));
        const progress = lit / KM_STONES;
        const full = lit === KM_STONES;
        const sinceRoll = s.cyc - (KM_ROLL_AT + 0.45);
        const flash = full && sinceRoll >= 0 && sinceRoll < 0.9 ? 1 - sinceRoll / 0.9 : 0;

        // Dönen altın ışık huzmeleri ve hale (tam açıldığında)
        if (full) {
            const g = ctx.createRadialGradient(0, 0, 96, 0, 0, 128);
            g.addColorStop(0, rgba(KM_GOLD, 0.55 + 0.3 * flash)); g.addColorStop(1, rgba(KM_GOLD, 0));
            ctx.save();
            ctx.rotate(t * 0.08);
            ctx.fillStyle = g;
            for (let i = 0; i < 24; i++) {
                const a = (i / 24) * TAU, hw = i % 2 ? 0.03 : 0.055, R = i % 2 ? 116 : 128;
                ctx.beginPath();
                ctx.moveTo(95 * Math.cos(a - hw * 0.5), 95 * Math.sin(a - hw * 0.5));
                ctx.lineTo(R * Math.cos(a - hw), R * Math.sin(a - hw));
                ctx.lineTo(R * Math.cos(a + hw), R * Math.sin(a + hw));
                ctx.lineTo(95 * Math.cos(a + hw * 0.5), 95 * Math.sin(a + hw * 0.5));
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();
            const h = ctx.createRadialGradient(0, 0, 94, 0, 0, 116);
            h.addColorStop(0, rgba(accent, 0.3 + 0.08 * Math.sin(t * 1.6))); h.addColorStop(1, rgba(accent, 0));
            annulus(ctx, 94, 116); ctx.fillStyle = h; ctx.fill();
        }

        // Gövde: gece mavisi mine, altın pahlar
        const enamel = ctx.createRadialGradient(0, 0, 74, 0, 0, 95.5);
        enamel.addColorStop(0, '#0a1430'); enamel.addColorStop(0.45, '#1d3a7a'); enamel.addColorStop(1, '#081028');
        annulus(ctx, 74, 95.5); ctx.fillStyle = enamel; ctx.fill();

        // Harita kontur çizgileri yavaşça kayar
        ctx.save();
        annulus(ctx, 74.5, 95); ctx.clip();
        ctx.lineWidth = 0.45;
        for (let c = 0; c < 6; c++) {
            const base = 76.5 + c * 3.4;
            ctx.strokeStyle = `rgba(214,182,110,${0.16 + (c % 2) * 0.08})`;
            ctx.beginPath();
            for (let i = 0; i <= 240; i++) {
                const a = (i / 240) * TAU;
                const r = base + 1.4 * Math.sin(3 * a + c * 1.7 + t * 0.15) + 0.9 * Math.sin(7 * a - c + t * 0.1);
                i ? ctx.lineTo(r * Math.cos(a), r * Math.sin(a)) : ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
            }
            ctx.stroke();
        }
        ctx.restore();

        metalBand(ctx, 95.5, 99, GOLD_STOPS, t * 0.45, 3);
        metalBand(ctx, 71.5, 74, GOLD_STOPS, t * 0.45 + 1.1, 3);
        hairline(ctx, 74, 'rgba(60,40,5,.7)', 0.6); hairline(ctx, 95.5, 'rgba(60,40,5,.7)', 0.6);
        ctx.strokeStyle = 'rgba(255,240,190,.55)'; ctx.lineWidth = 0.4;
        ctx.beginPath();
        for (let i = 0; i < 96; i++) {
            const a = (i / 96) * TAU;
            ctx.moveTo(96.2 * Math.cos(a), 96.2 * Math.sin(a)); ctx.lineTo(98.3 * Math.cos(a), 98.3 * Math.sin(a));
        }
        ctx.stroke();

        // Rota: katedilmemiş kısım kesik çizgi, katedilen kısım parlak altın
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        const routePath = (q0: number, q1: number) => {
            ctx.beginPath();
            const n = Math.max(2, Math.ceil((q1 - q0) * 360));
            for (let i = 0; i <= n; i++) {
                const [x, y] = routePt(lerp(q0, q1, i / n));
                i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
        };
        if (progress < 1) {
            ctx.setLineDash([1.6, 2.4]);
            routePath(progress, 1); ctx.strokeStyle = 'rgba(214,182,110,.4)'; ctx.lineWidth = 0.9; ctx.stroke();
            ctx.setLineDash([]);
        }
        if (progress > 0) {
            routePath(0, progress);
            ctx.strokeStyle = 'rgba(40,24,0,.6)'; ctx.lineWidth = 3.2; ctx.stroke();
            ctx.strokeStyle = '#e9bd4e'; ctx.lineWidth = 2; ctx.stroke();
            ctx.setLineDash([3, 5]); ctx.lineDashOffset = -t * 14;
            ctx.strokeStyle = 'rgba(255,250,225,.9)'; ctx.lineWidth = 0.8; ctx.stroke();
            ctx.setLineDash([]); ctx.lineDashOffset = 0;
        }

        // Kilometre taşları: beyaz gövde, tema renginde başlık; geçilen taşlar parlar
        for (let k = 0; k < KM_STONES; k++) {
            const q = (k + 0.5) / KM_STONES, on = k < lit;
            const a = routeAngle(q), [x, y] = routePt(q);
            const near = on ? Math.exp(-((((s.ride - q + 1.5) % 1 - 0.5) / 0.035) ** 2)) : 0;
            if (on) { ctx.globalCompositeOperation = 'lighter'; bloom(ctx, x, y, 7 + 7 * near + 6 * flash, KM_GOLD, 0.45 + 0.5 * near + 0.4 * flash); ctx.globalCompositeOperation = 'source-over'; }
            ctx.save();
            ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
            ctx.fillStyle = 'rgba(0,0,0,.35)';
            ctx.beginPath(); ctx.roundRect(-2.4, -3, 5, 6.8, [2.4, 2.4, 0.6, 0.6]); ctx.fill();
            ctx.fillStyle = on ? '#fbfaf6' : '#4a5168';
            ctx.beginPath(); ctx.roundRect(-2.2, -3.4, 4.4, 6.6, [2.2, 2.2, 0.5, 0.5]); ctx.fill();
            ctx.fillStyle = on ? rgba(accent, 1) : '#2a3048';
            ctx.beginPath(); ctx.roundRect(-2.2, -3.4, 4.4, 2.6, [2.2, 2.2, 0, 0]); ctx.fill();
            ctx.fillStyle = on ? 'rgba(30,30,40,.8)' : 'rgba(255,255,255,.2)';
            ctx.fillRect(-1.2, 0.2, 2.4, 0.5); ctx.fillRect(-1.2, 1.3, 2.4, 0.5);
            ctx.restore();
        }

        // Sürücü: rotada ilerleyen tema renginde ışık ve altın kıvılcım izi
        if (progress > 0) {
            for (let j = 14; j > 0; j--) {
                const q = s.ride - j * 0.004;
                if (q < 0) continue;
                const [x, y] = routePt(q);
                ctx.fillStyle = rgba(mix(KM_GOLD, WHITE, 0.3), (1 - j / 14) * 0.8);
                ctx.beginPath(); ctx.arc(x, y, 1.6 * (1 - j / 18), 0, TAU); ctx.fill();
            }
            const [rx, ry] = routePt(s.ride);
            ctx.globalCompositeOperation = 'lighter';
            bloom(ctx, rx, ry, 9, accent, 1);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, TAU); ctx.fill();
        }

        sheen(ctx, 71.5, 99, t * 1.1, 0.4, true);
        hairline(ctx, 71.8, 'rgba(0,0,0,.35)', 0.5);

        // Mekanik kilometre sayacı: tamburlar 0999'dan 1000'e kademeli döner
        const shown = full ? 1000 : lit * 100;
        const roll = full ? clamp((s.cyc - KM_ROLL_AT) / 0.45) : 1;
        const from = full ? 999 : shown, to = shown;
        ctx.save();
        ctx.translate(0, 96);
        const plate = ctx.createLinearGradient(0, -8, 0, 8);
        plate.addColorStop(0, '#fff3c4'); plate.addColorStop(0.5, '#d9a733'); plate.addColorStop(1, '#7a5412');
        ctx.fillStyle = plate;
        ctx.beginPath(); ctx.roundRect(-20, -7.5, 40, 15, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(60,40,5,.85)'; ctx.lineWidth = 0.7; ctx.stroke();
        ctx.fillStyle = '#07090f';
        ctx.beginPath(); ctx.roundRect(-17.5, -5.5, 26.5, 11, 2); ctx.fill();
        ctx.font = '800 7.4px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const fd = String(from).padStart(4, '0'), td = String(to).padStart(4, '0');
        for (let i = 0; i < 4; i++) {
            const cx = -14.3 + i * 6.4;
            ctx.save();
            ctx.beginPath(); ctx.rect(cx - 2.9, -5, 5.8, 10); ctx.clip();
            const g = ctx.createLinearGradient(0, -5, 0, 5);
            g.addColorStop(0, '#000'); g.addColorStop(0.5, '#1b1f2a'); g.addColorStop(1, '#000');
            ctx.fillStyle = g; ctx.fillRect(cx - 2.9, -5, 5.8, 10);
            // Sağdaki tambur önce döner, soldakiler kademeli olarak takip eder
            const k = fd[i] === td[i] ? 1 : clamp(roll * 1.6 - (3 - i) * 0.2);
            const e = 1 - (1 - k) ** 3;
            ctx.fillStyle = i === 0 && full ? rgba(mix(accent, WHITE, 0.25), 1) : '#f4f1e8';
            if (e < 1) ctx.fillText(fd[i], cx, 0.4 - 10 * e);
            ctx.fillText(td[i], cx, 0.4 + 10 * (1 - e));
            ctx.restore();
        }
        ctx.fillStyle = '#5b3d08';
        ctx.font = '900 4.6px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillText('KM', 14.2, 0.4);
        if (flash > 0) { ctx.globalCompositeOperation = 'lighter'; bloom(ctx, 0, 0, 22, KM_GOLD, flash); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore();

        // Madalyon: altın disk, kabartma 1000, tema renginde taş
        ctx.save();
        ctx.translate(0, -101 + 0.8 * Math.sin(t * 1.4));
        if (full) { ctx.globalCompositeOperation = 'lighter'; bloom(ctx, 0, 0, 22, KM_GOLD, 0.5 + 0.2 * Math.sin(t * 2)); ctx.globalCompositeOperation = 'source-over'; }
        ctx.fillStyle = metal(ctx, GOLD_STOPS, t * 0.6, 2);
        ctx.beginPath();
        for (let i = 0; i < 32; i++) {
            const r = i % 2 ? 11.2 : 12.6, a = (i / 32) * TAU;
            ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(70,45,5,.8)'; ctx.lineWidth = 0.5; ctx.stroke();
        const disc = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
        disc.addColorStop(0, '#1d3a7a'); disc.addColorStop(1, '#081028');
        ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(0, 0, 9.2, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#e9bd4e'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillStyle = full ? '#f3d572' : 'rgba(243,213,114,.7)';
        ctx.font = `italic 900 ${full ? 6.6 : 7.2}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(shown), 0, -0.8);
        ctx.font = '800 3.2px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillText('KM', 0, 4.6);
        ctx.restore();

        // Sayaç dönünce şok dalgası ve altın kıvılcımlar
        if (flash > 0) {
            const q = 1 - flash;
            ctx.strokeStyle = rgba(KM_GOLD, (1 - q) * 0.85); ctx.lineWidth = 2.6 * (1 - q) + 0.4;
            ctx.beginPath(); ctx.arc(0, 0, 100 + 28 * (1 - (1 - q) * (1 - q)), 0, TAU); ctx.stroke();
        }
        for (const p of s.burst) {
            const k = clamp(p.life / p.max);
            ctx.fillStyle = rgba(mix(KM_GOLD, WHITE, 0.4 * k), k);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * k), 0, TAU); ctx.fill();
        }
        if (full) {
            for (const d of s.dust) {
                const tw = 0.5 + 0.5 * Math.sin(t * 2.4 + d.ph);
                ctx.fillStyle = rgba(GOLD_DUST, 0.25 + 0.7 * tw);
                ctx.beginPath(); ctx.arc(d.r * Math.cos(d.a), d.r * Math.sin(d.a) + 2 * Math.sin(t + d.ph), d.size * (0.7 + 0.5 * tw), 0, TAU); ctx.fill();
            }
        }
    },
};

// ============================================================================
// KURUCU — Motonom'a ilk kaydolan 10 kişiye özel, sıra numaralı çerçeve.
// Pırlanta kesimli prizmatik kristal halka ve platin pahlar: dönen ışık 320 faseti tek tek yakar,
// parlayan fasetler gökkuşağı ışıltısı saçar. Arkada kutup ışığı perdeleri dalgalanır.
// Halkadaki 10 kristal koltuk 10 kurucuyu temsil eder; ışık birkaç saniyede bir 1'den başlayıp
// sırayla ilerler ve kullanıcının numarasında durur: yıldız patlaması, yatay ışık çizgisi, şok dalgası.
// env.level (1-10): kullanıcının kurucu sıra numarası.
// ============================================================================

const FOUNDER_SEATS = 10;
const FOUNDER_CYCLE = 6.5;
const FOUNDER_STEP = 0.17;
const SEAT_R = 97.2;
const AURORA: RGB[] = [[80, 220, 255], [170, 110, 255]];

const hsl = (h: number, s: number, l: number): RGB => {
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h * 12) % 12;
        return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    };
    return [f(0), f(8), f(4)];
};

interface Facet { a: [number, number]; b: [number, number]; c: [number, number]; o: number; h: number }

// Her hücre merkezden dört üçgene bölünür: pırlanta tacı gibi bir kesim
const FOUNDER_FACETS: Facet[] = (() => {
    const rnd = mulberry32(2026);
    const facets: Facet[] = [];
    const N = 40, rows = [74, 84.5, 95.2];
    const p = (r: number, a: number): [number, number] => [r * Math.cos(a), r * Math.sin(a)];
    for (let i = 0; i < N; i++) {
        const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU, am = (a0 + a1) / 2;
        for (let row = 0; row < 2; row++) {
            const ri = rows[row], ro = rows[row + 1], c = p((ri + ro) / 2, am);
            const corners = [p(ri, a0), p(ri, a1), p(ro, a1), p(ro, a0)];
            for (let k = 0; k < 4; k++) {
                facets.push({ a: corners[k], b: corners[(k + 1) % 4], c, o: am + (rnd() - 0.5) * 1.7 + k * 0.4, h: rnd() });
            }
        }
    }
    return facets;
})();

const seatAngle = (k: number) => -Math.PI / 2 + ((k + 0.5) / FOUNDER_SEATS) * TAU;

// Dört uzun, dört kısa kollu yıldız parlaması
const flare = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, col: RGB, alpha: number) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    for (let i = 0; i < 8; i++) {
        const long = i % 2 === 0, len = long ? size : size * 0.5, w = len * (long ? 0.09 : 0.11);
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        const g = ctx.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, rgba(mix(col, WHITE, 0.7), alpha)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, -w); ctx.lineTo(len, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
};

interface Glitter { a: number; r: number; w: number; ph: number; h: number; size: number }

const founder: FrameDef<{ cyc: number; glitter: Glitter[] }> = {
    init: ({ rnd }) => ({
        cyc: 0,
        glitter: Array.from({ length: 44 }, () => ({
            a: rnd() * TAU, r: 101 + rnd() * 26, w: (0.05 + rnd() * 0.2) * (rnd() < 0.5 ? 1 : -1), ph: rnd() * TAU, h: rnd(), size: 0.6 + rnd() * 1.1,
        })),
    }),
    step: (s, { dt }) => {
        s.cyc = (s.cyc + dt) % FOUNDER_CYCLE;
        for (const g of s.glitter) g.a += g.w * dt;
    },
    draw: (s, { ctx, t, accent, level }) => {
        const n = Math.max(1, Math.min(FOUNDER_SEATS, Math.round(level)));
        const chase = (s.cyc - 0.4) / FOUNDER_STEP;
        const since = s.cyc - 0.4 - (n - 1) * FOUNDER_STEP;
        const burst = since >= 0 && since < 1.3 ? 1 - since / 1.3 : 0;

        // Kutup ışığı perdeleri: dalgalanan üç bant, çerçevenin dışına taşar
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        [accent, ...AURORA].forEach((col, li) => {
            const g = ctx.createRadialGradient(0, 0, 94, 0, 0, 128);
            g.addColorStop(0, rgba(col, 0.55)); g.addColorStop(0.45, rgba(col, 0.22)); g.addColorStop(1, rgba(col, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            const M = 120;
            for (let i = 0; i <= M; i++) {
                const a = (i / M) * TAU;
                const w = 0.5 + 0.5 * Math.sin(3 * a + t * (0.6 + li * 0.17) + li * 2.1) * Math.sin(5 * a - t * 0.35 + li);
                const r = 104 + 22 * w * w + 3 * Math.sin(9 * a + t * 1.3 + li);
                i ? ctx.lineTo(r * Math.cos(a), r * Math.sin(a)) : ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
            }
            for (let i = M; i >= 0; i--) {
                const a = (i / M) * TAU;
                ctx.lineTo(95 * Math.cos(a), 95 * Math.sin(a));
            }
            ctx.closePath(); ctx.fill();
        });
        ctx.restore();

        // Kristal fasetler
        const L = t * 0.75;
        const base = mix([10, 14, 26], accent, 0.1);
        for (const f of FOUNDER_FACETS) {
            const b = 0.5 + 0.5 * Math.cos(f.o - L);
            const sp = b ** 10;
            // Koyu gövde, keskin beyaz parıltı; gökkuşağı ateşi yalnızca en parlak fasetlerde
            let c = mix(base, [150, 180, 225], b ** 3.2);
            if (sp > 0.18) c = mix(c, hsl((f.h + t * 0.08) % 1, 1, 0.58), clamp((sp - 0.18) * 2.2));
            c = mix(c, WHITE, sp * sp * 0.85);
            ctx.fillStyle = rgba(c, 1);
            ctx.beginPath(); ctx.moveTo(f.a[0], f.a[1]); ctx.lineTo(f.b[0], f.b[1]); ctx.lineTo(f.c[0], f.c[1]); ctx.closePath(); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 0.25;
        ctx.beginPath();
        for (const f of FOUNDER_FACETS) { ctx.moveTo(f.a[0], f.a[1]); ctx.lineTo(f.b[0], f.b[1]); ctx.lineTo(f.c[0], f.c[1]); ctx.closePath(); }
        ctx.stroke();
        if (ctx.createConicGradient) {
            const pr = ctx.createConicGradient(-t * 0.35, 0, 0);
            ['255,80,120', '255,200,80', '90,240,170', '80,170,255', '190,110,255', '255,80,120'].forEach((c, i) => pr.addColorStop(i / 5, `rgba(${c},.1)`));
            annulus(ctx, 74, 95.2); ctx.fillStyle = pr; ctx.fill();
        }

        // Platin pahlar
        metalBand(ctx, 95.2, 99.4, METALS.platinum, t * 0.5, 3);
        metalBand(ctx, 71.5, 74, METALS.platinum, t * 0.5 + 1.1, 3);
        hairline(ctx, 74, 'rgba(40,50,64,.7)', 0.5); hairline(ctx, 95.2, 'rgba(40,50,64,.7)', 0.5);
        sheen(ctx, 71.5, 99.4, t * 1.2, 0.5, true);

        // #01'e özel dönen prizmatik hale
        if (n === 1 && ctx.createConicGradient) {
            const pr = ctx.createConicGradient(t * 0.9, 0, 0);
            ['255,80,120', '255,200,80', '90,240,170', '80,170,255', '190,110,255', '255,80,120'].forEach((c, i) => pr.addColorStop(i / 5, `rgba(${c},.9)`));
            annulus(ctx, 100.6, 102.2); ctx.fillStyle = pr; ctx.fill();
        }

        // Kurucu koltukları: ışık 1'den başlayıp sırayla ilerler, kullanıcının koltuğunda durur
        for (let k = 0; k < FOUNDER_SEATS; k++) {
            const a = seatAngle(k), x = SEAT_R * Math.cos(a), y = SEAT_R * Math.sin(a);
            const own = k === n - 1;
            const passed = k < n && chase >= k ? Math.exp(-(chase - k) * 1.2) : 0;
            if (own) {
                ctx.globalCompositeOperation = 'lighter';
                bloom(ctx, x, y, 15 + 4 * Math.sin(t * 3) + 18 * burst, accent, 0.9);
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = rgba(mix(accent, WHITE, 0.5), 0.9); ctx.lineWidth = 0.7;
                ctx.beginPath(); ctx.arc(x, y, 7.4 + 0.6 * Math.sin(t * 3), 0, TAU); ctx.stroke();
                gem(ctx, x, y, 5, a + Math.PI / 2, rgba(mix(accent, WHITE, 0.45), 1), rgba(mix(accent, [0, 0, 0], 0.25), 1), '#eef2f6');
            } else {
                if (passed > 0.05) { ctx.globalCompositeOperation = 'lighter'; bloom(ctx, x, y, 8, [200, 230, 255], passed); ctx.globalCompositeOperation = 'source-over'; }
                gem(ctx, x, y, 2.3, a + Math.PI / 2, passed > 0.3 ? '#ffffff' : '#e6f3ff', '#7b93b5', '#aab4c0');
            }
        }

        // Kullanıcının koltuğunda: yıldız parlaması, yatay ışık çizgisi, şok dalgası
        const oa = seatAngle(n - 1), ox = SEAT_R * Math.cos(oa), oy = SEAT_R * Math.sin(oa);
        ctx.globalCompositeOperation = 'lighter';
        flare(ctx, ox, oy, 9 + 3 * Math.sin(t * 2.4) + 20 * burst, t * 0.4, mix(accent, WHITE, 0.3), 0.8);
        if (burst > 0) {
            const g = ctx.createLinearGradient(ox - 70, oy, ox + 70, oy);
            g.addColorStop(0, rgba(accent, 0)); g.addColorStop(0.5, rgba(mix(accent, WHITE, 0.6), burst)); g.addColorStop(1, rgba(accent, 0));
            ctx.fillStyle = g;
            ctx.fillRect(ox - 70, oy - 0.7 * burst - 0.2, 140, 1.4 * burst + 0.4);
        }
        ctx.globalCompositeOperation = 'source-over';
        if (burst > 0) {
            const q = 1 - burst;
            ctx.strokeStyle = rgba(mix(accent, WHITE, 0.4), burst * 0.85); ctx.lineWidth = 2.6 * burst + 0.4;
            ctx.beginPath(); ctx.arc(0, 0, 100 + 28 * (1 - (1 - q) * (1 - q)), 0, TAU); ctx.stroke();
        }

        // Elmas biçimli kristal rozet ve sıra numarası
        ctx.save();
        ctx.translate(0, -103 + 0.8 * Math.sin(t * 1.5));
        const R = [[0, -14], [15, 0], [0, 14], [-15, 0]];
        const cx = 0, cy = -1;
        for (let k = 0; k < 4; k++) {
            const p0 = R[k], p1 = R[(k + 1) % 4];
            const b = 0.5 + 0.5 * Math.cos(k * 1.6 + 0.7 - L * 1.3);
            ctx.fillStyle = rgba(mix([14, 20, 34], [120, 150, 200], b ** 2), 1);
            ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
        }
        ctx.beginPath(); R.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
        ctx.strokeStyle = metal(ctx, METALS.platinum, t, 2); ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
        if (ctx.createConicGradient) {
            const pr = ctx.createConicGradient(t * 1.2, 0, 0);
            ['255,80,120', '255,200,80', '90,240,170', '80,170,255', '190,110,255', '255,80,120'].forEach((c, i) => pr.addColorStop(i / 5, `rgba(${c},.7)`));
            ctx.strokeStyle = pr; ctx.lineWidth = 0.6; ctx.stroke();
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'italic 900 9px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(n).padStart(2, '0'), 0, 0.8);
        if (showText(ctx)) {
            ctx.font = '800 2.6px ui-monospace, SFMono-Regular, Menlo, monospace';
            ctx.fillStyle = rgba(mix(accent, WHITE, 0.55), 1);
            ctx.fillText('KURUCU', 0, -6.4);
        }
        flare(ctx, 10, -8, 5 + 2 * Math.sin(t * 3.1), t * 0.6, WHITE, 0.85);
        ctx.restore();

        // Gökkuşağı ışıltıları
        for (const g of s.glitter) {
            const tw = Math.max(0, Math.sin(t * 2.2 + g.ph)) ** 3;
            if (tw < 0.05) continue;
            const x = g.r * Math.cos(g.a), y = g.r * Math.sin(g.a);
            const c = hsl((g.h + t * 0.05) % 1, 1, 0.7);
            star(ctx, x, y, g.size * 4 * tw, t * 0.5 + g.ph, tw * 0.9);
            ctx.fillStyle = rgba(c, tw);
            ctx.beginPath(); ctx.arc(x, y, g.size * 0.8, 0, TAU); ctx.fill();
        }
        hairline(ctx, 71.8, 'rgba(0,0,0,.35)', 0.5);
    },
};

const FRAMES: Record<PremiumFrameId, FrameDef<any>> = {
    'apex': apex,
    'redline': redline,
    'wind-tunnel': windTunnel,
    'night-road': nightRoad,
    'volt': volt,
    'gold': gold,
    'sparks': sparks,
    'hud': hud,
    'pulse': pulse,
    'kustom': kustom,
    'podium': podium,
    'telemetry': telemetry,
    ...Object.fromEntries(RANK_IDS.map((id, i) => [id, rankFrame(i + 1)])) as Record<typeof RANK_IDS[number], FrameDef<any>>,
    'convoy': convoy,
    'storyteller': storyteller,
    'kilometre': kilometre,
    'founder': founder,
};

// --- RUNTIME: tek bir requestAnimationFrame döngüsü tüm çerçeveleri sürer ---

interface Instance { tick: (dt: number) => void; visible: boolean }

const instances = new Set<Instance>();
let rafId = 0;
let lastTime = 0;
let paused = false;

// Tüm premium çerçeveleri dondurur / devam ettirir (ör. pil tasarrufu modu)
export const setPremiumFramesPaused = (value: boolean) => { paused = value; };

const loop = (now: number) => {
    // rAF zaman damgası döngü başlangıcından önce olabilir: dt asla negatif olmamalı
    const dt = Math.max(0, Math.min(0.05, (now - lastTime) / 1000));
    lastTime = now;
    if (!paused) instances.forEach(inst => { if (inst.visible) inst.tick(dt); });
    rafId = instances.size ? requestAnimationFrame(loop) : 0;
};

const parseColor = (ctx: CanvasRenderingContext2D, value: string, fallback: RGB): RGB => {
    ctx.fillStyle = '#000001';
    ctx.fillStyle = value;
    const v = String(ctx.fillStyle);
    if (v === '#000001') return fallback;
    if (v[0] === '#') return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    const m = v.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : fallback;
};

// Tema rengini (--moto-accent) canvas'ın bulunduğu yerden okur
export const readAccent = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): RGB =>
    parseColor(ctx, getComputedStyle(canvas).getPropertyValue('--moto-accent').trim(), [242, 166, 25]);

// Ortak sürücü: görünürlük, "hareketi azalt" ve duraklatma tüm canvas çerçeveleri için burada yönetilir.
// "Hareketi azalt" açıksa tick hiç çağrılmaz, still() tek bir sabit kare çizer.
export const driveFrame = (canvas: HTMLCanvasElement, hooks: { tick: (dt: number) => void; still: () => void }): (() => void) => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        hooks.still();
        const ro = new ResizeObserver(() => hooks.still());
        ro.observe(canvas);
        return () => ro.disconnect();
    }
    const inst: Instance = { visible: true, tick: hooks.tick };
    const io = new IntersectionObserver(entries => { inst.visible = entries[entries.length - 1].isIntersecting; });
    io.observe(canvas);
    instances.add(inst);
    if (!rafId) { lastTime = performance.now(); rafId = requestAnimationFrame(loop); }
    return () => {
        io.disconnect();
        instances.delete(inst);
    };
};

export const mountPremiumFrame = (canvas: HTMLCanvasElement, id: PremiumFrameId): (() => void) =>
    mountScene(canvas, FRAMES[id], id.length * 7919 + 13);

// Herhangi bir sahneyi (çerçeve ya da rozet) canvas'a bağlar; dönen fonksiyon temizler
export const mountScene = <S,>(canvas: HTMLCanvasElement, def: FrameDef<S>, seed: number): (() => void) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    const readLevel = () => { const v = Number(canvas.dataset.level); return Number.isFinite(v) && canvas.dataset.level !== '' ? v : 10; };
    const env: Env = { ctx, t: 0, dt: 0, accent: [242, 166, 25], rnd: mulberry32(seed), level: readLevel(), data: canvas.dataset };
    const state = def.init(env);
    let frames = 0;

    const render = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const size = canvas.clientWidth;
        const px = Math.round(size * dpr);
        if (!px) return;
        if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
        const k = px / 260;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, px, px);
        ctx.setTransform(k, 0, 0, k, px / 2, px / 2);
        ctx.globalCompositeOperation = 'source-over';
        def.draw(state, env);
    };

    const advance = (dt: number) => { env.dt = dt; env.t += dt; def.step(state, env); };

    env.accent = readAccent(canvas, ctx);
    return driveFrame(canvas, {
        tick: dt => {
            if (frames++ % 45 === 0) { env.accent = readAccent(canvas, ctx); env.level = readLevel(); }
            advance(dt);
            render();
        },
        still: () => {
            // Sahneyi biraz ilerletip anlamlı bir an göster
            if (env.t === 0) for (let i = 0; i < 150; i++) advance(1 / 30);
            env.accent = readAccent(canvas, ctx);
            env.level = readLevel();
            render();
        },
    });
};
