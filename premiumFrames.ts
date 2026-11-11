// Ultra premium profil çerçeveleri için canvas tabanlı hareket motoru.
// React'ten bağımsızdır: mountPremiumFrame(canvas, id) çağrılır, dönen fonksiyon temizler.
// Koordinat sistemi SVG çerçevelerle aynıdır: merkez (0,0), avatar yarıçapı 71, çerçeve bandı 72..100.
// Canvas, çerçeve kutusunun %130'unu kaplar; 100..130 arası parlama ve parçacık taşması içindir.

export type PremiumFrameId = 'apex' | 'redline' | 'wind-tunnel' | 'night-road' | 'volt' | 'gold';

export const PREMIUM_FRAME_IDS: PremiumFrameId[] = ['apex', 'redline', 'wind-tunnel', 'night-road', 'volt', 'gold'];

type RGB = [number, number, number];

interface Env {
    ctx: CanvasRenderingContext2D;
    t: number;
    dt: number;
    accent: RGB;
    rnd: () => number;
}

interface FrameDef<S> {
    init: (env: Env) => S;
    step: (s: S, env: Env) => void;
    draw: (s: S, env: Env) => void;
}

// --- HELPERS ---

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a)})`;
const mix = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

const WHITE: RGB = [255, 255, 255];
const RED: RGB = [255, 59, 48];

const mulberry32 = (seed: number) => () => {
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

const bloom = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: RGB, a: number) => {
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

const star = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, alpha: number) => {
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

const FRAMES: Record<PremiumFrameId, FrameDef<any>> = {
    'apex': apex,
    'redline': redline,
    'wind-tunnel': windTunnel,
    'night-road': nightRoad,
    'volt': volt,
    'gold': gold,
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
    const dt = Math.min(0.05, (now - lastTime) / 1000);
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

export const mountPremiumFrame = (canvas: HTMLCanvasElement, id: PremiumFrameId): (() => void) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    const def = FRAMES[id];
    const env: Env = { ctx, t: 0, dt: 0, accent: [242, 166, 25], rnd: mulberry32(id.length * 7919 + 13) };
    const state = def.init(env);
    let frames = 0;

    const readAccent = () => {
        env.accent = parseColor(ctx, getComputedStyle(canvas).getPropertyValue('--moto-accent').trim(), [242, 166, 25]);
    };

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

    readAccent();
    // "Hareketi azalt" açıksa: sahneyi biraz ilerletip tek bir sabit kare çiz
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (let i = 0; i < 150; i++) advance(1 / 30);
        render();
        const ro = new ResizeObserver(() => { readAccent(); render(); });
        ro.observe(canvas);
        return () => ro.disconnect();
    }

    const inst: Instance = {
        visible: true,
        tick: dt => {
            if (frames++ % 45 === 0) readAccent();
            advance(dt);
            render();
        },
    };
    const io = new IntersectionObserver(entries => { inst.visible = entries[entries.length - 1].isIntersecting; });
    io.observe(canvas);
    instances.add(inst);
    if (!rafId) { lastTime = performance.now(); rafId = requestAnimationFrame(loop); }

    return () => {
        io.disconnect();
        instances.delete(inst);
    };
};
