// İmza serisi profil çerçeveleri: GPU'da (WebGL) piksel piksel hesaplanan ışık ve malzeme efektleri.
// Sayfadaki tüm çerçeveler tek bir paylaşılan WebGL bağlamıyla çizilir ve her biri kendi 2D canvas'ına
// kopyalanır; böylece tarayıcının WebGL bağlam sınırına takılmadan istenen kadar çerçeve kullanılabilir.
// Koordinatlar premiumFrames ile aynıdır: merkez (0,0), avatar yarıçapı 71, çerçeve bandı 72..100,
// canvas ±130 birimi kaplar (taşan parıltı ve parçacıklar için).

import { driveFrame, readAccent, RGB } from './premiumFrames';

export type ShaderFrameId = 'liquid-chrome' | 'iridium' | 'carbon' | 'nitro' | 'burnout' | 'hyperspeed';

export const SHADER_FRAME_IDS: ShaderFrameId[] = ['liquid-chrome', 'iridium', 'carbon', 'nitro', 'burnout', 'hyperspeed'];

// --- GLSL ---

const COMMON = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_accent;
uniform vec4 u_params;

#define PI 3.14159265
#define TAU 6.28318531

float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3) { p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }

float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * (3. - 2. * f);
    return mix(
        mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), u.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), u.x), u.y),
        mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), u.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), u.x), u.y),
        u.z);
}

float fbm3(vec3 p, int oct) {
    float s = 0., a = .5;
    for (int i = 0; i < 6; i++) {
        if (i >= oct) break;
        s += a * noise3(p);
        p = p * 2.03 + vec3(1.7, 9.2, 3.1);
        a *= .5;
    }
    return s;
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

// Kenarları piksel boyutunda yumuşatılmış halka maskesi
float band(float r, float r0, float r1, float px) {
    return smoothstep(r0 - px, r0 + px, r) * (1. - smoothstep(r1 - px, r1 + px, r));
}

// İki açı arasındaki en kısa fark
float angDist(float a, float b) { return abs(mod(a - b + PI, TAU) - PI); }

float maxc(vec3 c) { return max(c.r, max(c.g, c.b)); }

// frame() önceden çarpılmış (premultiplied) renk döndürür
vec4 frame(vec2 p, float r, float a, float px);

void main() {
    vec2 p = (gl_FragCoord.xy - .5 * u_res) / u_res.x * 260.;
    float px = 260. / u_res.x;
    float r = length(p);
    vec4 c = frame(p, r, atan(p.y, p.x), px);
    // Hiçbir efekt profil fotoğrafının üzerine çizilmez
    c *= smoothstep(71. - px, 71. + px, r);
    c = clamp(c, 0., 1.);
    c.a = max(c.a, maxc(c.rgb));
    gl_FragColor = c;
}
`;

// 1) SIVI KROM — akışkan krom bir tüp; yüzeyde geniş dalgalar dolaşır, stüdyo ışıkları üzerinden kayar
const LIQUID_CHROME = `
float liquidH(vec2 p, float t) {
    vec2 q = rot(t * .2) * p;
    float h = fbm3(vec3(q * .022, t * .28), 3);
    float ang = atan(p.y, p.x);
    h += .1 * sin(ang * 5. - t * 1.8 + h * 4.);
    return h;
}

vec3 studio(vec3 R, float t) {
    float y = R.y;
    vec3 sky = mix(vec3(.62, .66, .74), vec3(1.08), smoothstep(.1, .85, y));
    vec3 ground = mix(vec3(.05, .05, .06), vec3(.3, .27, .25), smoothstep(-1., -.05, y));
    vec3 col = mix(ground, sky, smoothstep(-.05, .05, y));
    col *= 1. - .6 * exp(-pow(y * 20., 2.));
    float sx = R.x - .55 * sin(t * .37);
    col += 2.2 * exp(-pow(sx * 6., 2.)) * smoothstep(-.1, .5, y);
    col += 1. * exp(-pow((R.x + .7) * 10., 2.)) * smoothstep(-.3, .6, y);
    vec3 L = normalize(vec3(cos(t * .45), -.5, .55 + .3 * sin(t * .45)));
    col += u_accent * 1.3 * pow(max(dot(R, L), 0.), 10.);
    return col;
}

vec4 frame(vec2 p, float r, float a, float px) {
    float m = band(r, 71.5, 100., px);
    float shadow = .3 * exp(-pow((r - 101.) / 3.5, 2.)) * step(100., r);
    if (m <= 0.) return vec4(0., 0., 0., shadow);
    float t = u_time;
    vec2 dir = p / r;
    float s = clamp((r - 85.75) / 14.25, -1., 1.);
    float e = 1.2;
    float h0 = liquidH(p, t);
    vec2 g = vec2(liquidH(p + vec2(e, 0.), t) - h0, liquidH(p + vec2(0., e), t) - h0) / e;
    vec3 N = normalize(vec3(dir * s - g * 7., sqrt(max(1. - s * s, .015))));
    vec3 R = reflect(vec3(0., 0., -1.), N);
    vec3 col = studio(R, t);
    float fres = pow(1. - N.z, 4.);
    col *= mix(vec3(.9, .93, 1.), vec3(1.), fres);
    col = 1. - exp(-col * 1.25);
    return vec4(col * m, m);
}
`;

// 2) İRİDYUM VİZÖR — ince film girişimiyle açıya göre renk değiştiren kask vizörü ve parlak boyalı kabuk
const IRIDIUM = `
// Döngüsel iridyum paleti: lacivert, mor, pembe, altın, camgöbeği
vec3 iridium(float x) {
    x = fract(x) * 5.;
    vec3 c = mix(vec3(.06, .18, .75), vec3(.48, .12, .85), smoothstep(0., 1., x));
    c = mix(c, vec3(.95, .25, .55), smoothstep(1., 2., x));
    c = mix(c, vec3(1., .74, .2), smoothstep(2., 3., x));
    c = mix(c, vec3(.15, .85, .95), smoothstep(3., 4., x));
    return mix(c, vec3(.06, .18, .75), smoothstep(4., 5., x));
}

vec4 frame(vec2 p, float r, float a, float px) {
    float visor = band(r, 71.5, 91.6, px);
    float gasket = band(r, 91.4, 93.6, px);
    float shell = band(r, 93.4, 100., px);
    float m = max(visor, max(gasket, shell));
    if (m <= 0.) return vec4(0.);
    float t = u_time;
    vec2 dir = p / r;
    vec3 V = vec3(0., 0., 1.);
    float sweepAng = t * .85;
    vec3 Ls = normalize(vec3(cos(sweepAng), sin(sweepAng), .8));

    // Vizör: kavisli bant, yağ tabakası gibi akan film kalınlığı
    float s = clamp((r - 81.5) / 10.1, -1., 1.);
    vec2 q = rot(t * .1) * p;
    float swirl = fbm3(vec3(q * .028, t * .18), 4);
    float swirl2 = fbm3(vec3(q * .05 + 3.1, t * .25), 3);
    vec3 N = normalize(vec3(dir * s * .85 + (vec2(swirl, swirl2) - .5) * .25, sqrt(max(1. - .72 * s * s, .05))));
    vec3 R = reflect(-V, N);
    // İnce film kalınlığı ve bakış açısı renk paletinde ilerletir
    float d = .3 + .9 * swirl + .12 * sin(a * 3. + t * .6) + .2 * swirl2;
    vec3 film = iridium(d * (1.8 - .8 * N.z) + t * .05);
    float hor = smoothstep(-.15, .55, R.y);
    vec3 env = mix(vec3(.008, .008, .015), vec3(.22, .25, .32), hor);
    float sweep = exp(-pow(angDist(a, sweepAng) * 2.6, 2.));
    float spec = pow(max(dot(R, Ls), 0.), 50.);
    vec3 visorCol = env * .2 + film * (.6 + .55 * hor + .9 * sweep) + vec3(spec) * 1.6;
    visorCol *= .85 + .15 * smoothstep(1., .6, abs(s));

    // Lastik conta
    vec3 gasketCol = vec3(.02) + vec3(.12) * pow(max(dot(dir, vec2(-.5, .8)), 0.), 3.);

    // Kabuk: vernikli tema rengi boya
    float s2 = clamp((r - 96.7) / 3.3, -1., 1.);
    vec3 N2 = normalize(vec3(dir * s2, sqrt(max(1. - s2 * s2, .04))));
    vec3 R2 = reflect(-V, N2);
    vec3 paint = u_accent * (.28 + .55 * (N2.y * .5 + .5));
    paint += vec3(1.) * pow(max(dot(R2, normalize(vec3(-.4, .8, .55))), 0.), 24.) * .8;
    paint += vec3(1.) * pow(max(dot(R2, Ls), 0.), 60.) * 1.4;

    vec3 col = visorCol;
    col = mix(col, gasketCol, gasket);
    col = mix(col, paint, shell);
    col = 1. - exp(-col * 1.35);
    return vec4(col * m, m);
}
`;

// 3) KARBON — 2x2 dimi dokuma karbon; dönen ışıkta liflerin yönüne göre damalar yer değiştirir, üstte derin vernik
const CARBON = `
vec4 frame(vec2 p, float r, float a, float px) {
    float m = band(r, 71.5, 100., px);
    if (m <= 0.) return vec4(0.);
    float t = u_time;
    vec2 dir = p / r;
    vec2 tang = vec2(-dir.y, dir.x);

    float u = (a / TAU + .5) * 96.;
    float v = (r - 71.5) * .19;
    vec2 cell = floor(vec2(u, v));
    vec2 f = fract(vec2(u, v));
    float warp = step(mod(cell.x + cell.y, 4.), 1.5);
    float across = mix(f.x, f.y, warp);
    float bulge = sin(across * PI);
    float fiber = .9 + .1 * sin(across * 60. + hash12(cell) * 6.);

    // Küçük boyutlarda dokumanın titrememesi için ortalamaya geç
    float lod = smoothstep(.9, 2.2, px);
    bulge = mix(bulge, .64, lod);
    fiber = mix(fiber, .9, lod);

    vec2 T = mix(dir, tang, warp);
    vec2 acrossDir = mix(tang, dir, warp);
    vec3 Nw = normalize(vec3(acrossDir * cos(across * PI) * .55 * (1. - lod), 1.));

    float la = t * .55;
    vec3 L = normalize(vec3(cos(la), sin(la), .75));
    vec3 H = normalize(L + vec3(0., 0., 1.));
    float TH = dot(T, H.xy);
    float aniso = pow(sqrt(max(1. - TH * TH, 0.)), 22.);
    float diff = max(dot(Nw, L), 0.);

    vec3 col = vec3(.035, .037, .042) * (.5 + .5 * diff) * fiber;
    col += vec3(.36, .38, .43) * aniso * (.35 + .65 * bulge) * fiber;
    float gap = smoothstep(0., .1, across) * smoothstep(1., .9, across);
    col *= mix(.6, 1., mix(gap, 1., lod));

    // Tema rengi ince çizgiler (verniğin altında)
    float stripe = band(r, 73.4, 74.5, px) + band(r, 97.4, 98.5, px);
    col = mix(col, u_accent * .95, clamp(stripe, 0., 1.) * .9);

    // Vernik: kenarlarda kubbeleşen cam katman, uzun softbox yansıması ve keskin parlama
    float s = clamp((r - 85.75) / 14.25, -1., 1.);
    float edge = pow(abs(s), 5.);
    vec3 Nc = normalize(vec3(dir * s * edge * 1.6, 1.));
    vec3 R = reflect(vec3(0., 0., -1.), Nc);
    float sb = exp(-pow((dot(R.xy, vec2(cos(la + 1.3), sin(la + 1.3))) - .12) * 8., 2.));
    col += vec3(.85, .88, .95) * sb * .3;
    col += vec3(.05, .055, .065) * smoothstep(-.6, .8, dot(dir, vec2(-.5, .85)));
    col += vec3(1.) * pow(max(dot(R, L), 0.), 180.) * 1.4;
    col += vec3(1.) * edge * .18 * smoothstep(-.3, .9, dot(dir, vec2(-.55, .83)));
    col = 1. - exp(-col * 1.25);
    return vec4(col * m, m);
}
`;

// 4) NİTRO — titanyum nozul halkasından 24 egzoz jeti; jetlerde duran şok düğümleri (mach elmasları),
//    gaz verildikçe uzayan alev ve geri tepme patlaması. Koyu duman halesi açık zeminde de ateşi okutur.
const NITRO = `
vec3 fireRamp(float x) {
    vec3 c = mix(vec3(.45, .03, .02), mix(u_accent, vec3(1., .42, .08), .35), smoothstep(.0, .45, x));
    return mix(c, vec3(1., .95, .82), smoothstep(.55, 1.1, x));
}

vec4 frame(vec2 p, float r, float a, float px) {
    float t = u_time;
    float cyc = mod(t, 6.);
    float thr = .3 + .7 * smoothstep(.8, 2.1, cyc) * (1. - smoothstep(4.5, 5.1, cyc));
    float pop = exp(-pow((cyc - 5.25) * 8., 2.));
    vec2 dir = p / r;

    float smokeN = fbm3(vec3(dir * 3., r * .05 - t * .5), 3);
    float back = band(r, 71.5, 100.5, px);
    float halo = smoothstep(127., 99., r + (smokeN - .5) * 16.) * step(99.5, r) * .82;
    float bA = max(back, halo);
    vec4 P = vec4(vec3(.03, .024, .032) * bA, bA);

    float NJ = 24.;
    float ja = (a / TAU + .5) * NJ;
    float jid = floor(ja);
    float jf = fract(ja) - .5;
    float q = r - 79.;
    float jr = hash12(vec2(jid, 3.1));
    float turb = fbm3(vec3(dir * 5., q * .07 - t * (1.6 + 2.4 * thr)), 4);
    float lat = jf * TAU * r / NJ + (turb - .5) * max(q, 0.) * .2;
    float len = (16. + 32. * thr) * (.8 + .4 * jr);
    float width = 1.7 + max(q, 0.) * .24;
    float body = exp(-pow(lat / width, 2.)) * smoothstep(-1., 1.5, q);
    float temp = body * exp(-max(q, 0.) / len) * (.6 + .8 * turb) * (.65 + .55 * thr);
    vec3 fire = fireRamp(temp * 1.25) * temp * 1.35;
    float haze = exp(-max(q, 0.) / (len * .8)) * smoothstep(-1., 3., q) * turb * (.3 + .3 * thr);
    fire += fireRamp(.35) * haze * .35;
    vec3 core = vec3(.4, .6, 1.) * body * exp(-max(q, 0.) / 4.5) * (.7 + .8 * thr);

    float spacing = 7. + 2.5 * thr;
    float k = q / spacing;
    float node = floor(k + .5);
    float kd = (k - node) * spacing;
    float dshape = abs(kd) * .85 + abs(jf * TAU * r / NJ) * 1.6;
    float diamonds = exp(-dshape * dshape * .45) * step(.5, k) * exp(-node * (1. - .6 * thr)) * (.4 + thr) * (.92 + .08 * sin(t * 47. + jid * 3.));

    vec3 E = fire + core + vec3(.75, .88, 1.) * diamonds * 3.2
           + vec3(1., .78, .45) * pop * smoothstep(-2., 2., q) * exp(-max(q, 0.) / 26.) * 1.6;
    E = 1. - exp(-E * 1.3);
    E *= 1. - smoothstep(118., 129., r);
    P.rgb = P.rgb * (1. - maxc(E)) + E;
    P.a = max(P.a, maxc(E));

    // Nozul: yanık titanyum halka, gazla birlikte kızaran dış kenar
    float nozzle = band(r, 71.5, 79.5, px);
    float s = clamp((r - 75.5) / 4., -1., 1.);
    float shade = sqrt(max(1. - s * s, 0.));
    vec3 ti = .55 + .45 * cos(TAU * (vec3(0., .33, .67) + (r - 71.5) * .07 + .12 * sin(a * 2. + t * .3) + .55));
    vec3 nz = ti * (.18 + .55 * shade) + vec3(1.) * pow(max(dot(normalize(vec3(dir * s, shade + .01)), normalize(vec3(-.4, .7, .6))), 0.), 30.) * .6;
    nz += vec3(1., .35, .08) * smoothstep(76., 79.5, r) * (.25 + .9 * thr + pop);
    nz = 1. - exp(-nz * 1.3);
    P = mix(P, vec4(nz, 1.), nozzle);
    return P;
}
`;

// 5) BURNOUT — kızgın lastikten kopan, girdap gibi dönen ve dışarı taşan duman; içinde savrulan kor parçacıkları
const BURNOUT = `
float smoke(vec2 p, float r, float t) {
    vec2 dir = p / r;
    vec2 q = rot(t * 1.3 * 80. / r) * p;
    vec2 w = vec2(fbm3(vec3(q * .024, t * .14), 3), fbm3(vec3(q * .024 + 5.2, t * .14), 3));
    return fbm3(vec3(q * .03 + w * 2.4 - dir * t * .55, t * .22), 5);
}

vec4 frame(vec2 p, float r, float a, float px) {
    float t = u_time;
    vec2 dir = p / r;
    vec4 P = vec4(0.);

    if (r > 76. && r < 130.) {
        float d = smoke(p, r, t);
        float dl = smoke(p - normalize(vec2(-.55, .83)) * 5., r, t);
        float env = smoothstep(76., 86., r) * (1. - smoothstep(98., 127., r + (d - .5) * 34.));
        float dens = smoothstep(.32, .72, d) * env;
        float lit = clamp(.55 + (dl - d) * 4.5, 0., 1.);
        vec3 sc = mix(vec3(.16, .16, .19), vec3(.9, .9, .93), lit);
        float heat = smoothstep(96., 80., r);
        sc += u_accent * heat * (.35 + .4 * (1. - lit));
        float alpha = dens * .94;
        P = vec4(sc * alpha, alpha);
    }

    // Kor parçacıkları: logaritmik spiral boyunca dışarı savrulur
    float ember = 0.;
    for (int l = 0; l < 2; l++) {
        float fl = float(l);
        float NA = 36. + fl * 24.;
        vec2 sp = vec2((a / TAU + .5) * NA, log(max(r, 1.)) * (14. + fl * 8.) - t * (1.3 + fl * .6));
        sp.x += sp.y * .35;
        vec2 id = floor(sp);
        id.x = mod(id.x, NA);
        vec2 f = fract(sp) - .5;
        vec2 o = vec2(hash12(id + fl * 7.), hash12(id + 13. + fl * 7.)) - .5;
        float rnd = hash12(id * 1.7 + 3. + fl);
        float dist = length((f - o * .6) * vec2(1., .65));
        ember += step(.8, rnd) * smoothstep(.14, 0., dist) * (.6 + .4 * sin(t * 11. + rnd * 40.));
    }
    ember *= smoothstep(82., 92., r) * (1. - smoothstep(108., 128., r));
    vec3 E = vec3(1., .55, .15) * ember * 1.8;
    P.rgb = P.rgb * (1. - maxc(E)) + E;
    P.a = max(P.a, maxc(E));

    // Lastik: dönüşten bulanık sırt, sürtünmeden kızaran dış kenar
    float tire = band(r, 71.5, 81., px);
    float s = clamp((r - 76.25) / 4.75, -1., 1.);
    float shade = sqrt(max(1. - s * s, 0.));
    float blur = .5 + .5 * sin(a * 40. + t * 34.);
    vec3 tc = vec3(.03) + vec3(.07) * shade + vec3(.04) * blur * shade;
    tc += vec3(.35) * pow(max(dot(normalize(vec3(dir * s, shade + .01)), normalize(vec3(-.45, .75, .5))), 0.), 14.);
    float hot = smoothstep(77.5, 81., r);
    tc += mix(vec3(1., .2, .05), u_accent, .3) * hot * (.55 + .25 * sin(t * 7. + a * 3.));
    tc = 1. - exp(-tc * 1.3);
    P = mix(P, vec4(tc, 1.), tire);
    return P;
}
`;

// 6) HİPER HIZ — avatarın kenarından dışarı fırlayan ışık çizgileri, renk ayrışması, dışa akan tünel halkaları
//    ve periyodik boost şok dalgası. u_params.x: biriken yol (boost'ta hızlanır), .y: boost şiddeti, .z: şok evresi
const HYPERSPEED = `
float streaks(float rr, float a, float travel, float boost, float N, float seed, float wK) {
    float x = (a / TAU + .5) * N;
    float id = floor(x);
    float fx = fract(x) - .5;
    float h1 = hash12(vec2(id, 1. + seed)), h2 = hash12(vec2(id, 2. + seed)), h3 = hash12(vec2(id, 3. + seed));
    float ph = fract(travel * (.25 + .5 * h1) + h2);
    float head = 72. + 60. * ph * ph;
    float L = (4. + 34. * ph) * (.6 + .8 * h3) * (1. + 1.8 * boost);
    float along = smoothstep(head - L, head, rr) * (1. - smoothstep(head, head + 1.2, rr));
    float w = (.35 + .6 * ph) * wK;
    float lat = exp(-pow(fx * TAU * rr / N / w, 2.));
    return along * lat * step(.15, h3) * (.4 + 1.4 * ph);
}

vec4 frame(vec2 p, float r, float a, float px) {
    float travel = u_params.x, boost = u_params.y, shock = u_params.z;
    float base = band(r, 71.5, 100., px);
    float halo = smoothstep(125., 99., r) * step(99.5, r) * .85;
    float bA = max(base, halo);
    vec3 bg = mix(vec3(.015, .02, .06), vec3(.07, .035, .13), smoothstep(72., 100., r));
    float rings = pow(.5 + .5 * sin(log(r) * 70. - travel * 10.), 10.) * smoothstep(72., 86., r) * (1. - smoothstep(110., 124., r));
    bg += (u_accent * .5 + vec3(.15, .2, .6) * .4) * rings * (.25 + .4 * boost);
    bg += u_accent * .07 * smoothstep(90., 72., r);
    vec4 P = vec4(bg * bA, bA);

    float ca = .006 + .022 * boost;
    vec3 S = vec3(
        streaks(r * (1. - ca), a, travel, boost, 150., 0., 1.),
        streaks(r, a, travel, boost, 150., 0., 1.),
        streaks(r * (1. + ca), a, travel, boost, 150., 0., 1.));
    float S2 = streaks(r, a, travel * .7, boost, 64., 9., 2.2);
    vec3 tint = mix(vec3(1.), u_accent * 1.5, .25 + .3 * boost);
    vec3 E = S * tint * (1.5 + 1.5 * boost) + u_accent * S2 * (1. + boost);

    E += u_accent * exp(-pow((r - 72.6) / 1.6, 2.)) * (1.2 + 2.5 * boost);
    E += vec3(1.) * exp(-pow((r - 72.2) / .6, 2.)) * (.5 + boost);
    if (shock >= 0. && shock < 1.) {
        float sr = 100. + 30. * (1. - (1. - shock) * (1. - shock));
        E += mix(vec3(1.), u_accent, .5) * exp(-pow((r - sr) / (1.2 + 3. * shock), 2.)) * (1. - shock) * 1.6;
    }
    E = 1. - exp(-E * 1.2);
    E *= 1. - smoothstep(118., 130., r);
    P.rgb = P.rgb * (1. - maxc(E)) + E;
    P.a = max(P.a, maxc(E));
    return P;
}
`;

// --- FRAME DEFINITIONS ---

interface ShaderState { t: number; accent: RGB; params: [number, number, number, number] }

interface ShaderDef {
    source: string;
    advance?: (s: ShaderState, dt: number) => void;
}

const HYPER_CYCLE = 5;

const DEFS: Record<ShaderFrameId, ShaderDef> = {
    'liquid-chrome': { source: LIQUID_CHROME },
    'iridium': { source: IRIDIUM },
    'carbon': { source: CARBON },
    'nitro': { source: NITRO },
    'burnout': { source: BURNOUT },
    'hyperspeed': {
        source: HYPERSPEED,
        advance: (s, dt) => {
            const c = s.t % HYPER_CYCLE;
            const ss = (e0: number, e1: number, x: number) => { const k = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
            const boost = ss(2.6, 3, c) * (1 - ss(3.6, 4.6, c));
            s.params[0] += dt * (1 + 3 * boost);
            s.params[1] = boost;
            s.params[2] = (c - 2.75) / 0.9;
        },
    },
};

// --- SHARED WEBGL RENDERER ---

interface ProgramInfo {
    program: WebGLProgram;
    res: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    accent: WebGLUniformLocation | null;
    params: WebGLUniformLocation | null;
}

interface Renderer {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    programs: Partial<Record<ShaderFrameId, ProgramInfo | null>>;
}

const VERTEX = 'attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0., 1.); }';

let renderer: Renderer | null | undefined;

const getRenderer = (): Renderer | null => {
    if (renderer !== undefined) return renderer;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', {
        alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false,
        preserveDrawingBuffer: false, powerPreference: 'low-power',
    }) as WebGLRenderingContext | null;
    if (!gl) return (renderer = null);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.disable(gl.BLEND);
    // Bağlam kaybolursa bir sonraki karede yeniden kurulur
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); renderer = undefined; });
    return (renderer = { canvas, gl, programs: {} });
};

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('[ProfileFrame] shader derlenemedi:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

const getProgram = (r: Renderer, id: ShaderFrameId): ProgramInfo | null => {
    if (r.programs[id] !== undefined) return r.programs[id] ?? null;
    const { gl } = r;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, COMMON + DEFS[id].source);
    const program = vs && fs ? gl.createProgram() : null;
    if (!program || !vs || !fs) return (r.programs[id] = null);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'a_pos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('[ProfileFrame] shader bağlanamadı:', gl.getProgramInfoLog(program));
        return (r.programs[id] = null);
    }
    return (r.programs[id] = {
        program,
        res: gl.getUniformLocation(program, 'u_res'),
        time: gl.getUniformLocation(program, 'u_time'),
        accent: gl.getUniformLocation(program, 'u_accent'),
        params: gl.getUniformLocation(program, 'u_params'),
    });
};

// Çerçeveyi paylaşılan WebGL canvas'ının sol alt köşesine çizer
const renderShader = (r: Renderer, id: ShaderFrameId, size: number, s: ShaderState): boolean => {
    const info = getProgram(r, id);
    if (!info) return false;
    const { gl, canvas } = r;
    if (canvas.width < size || canvas.height < size) {
        canvas.width = Math.max(canvas.width, size);
        canvas.height = Math.max(canvas.height, size);
    }
    gl.viewport(0, 0, size, size);
    gl.useProgram(info.program);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(info.res, size, size);
    gl.uniform1f(info.time, s.t);
    gl.uniform3f(info.accent, s.accent[0] / 255, s.accent[1] / 255, s.accent[2] / 255);
    gl.uniform4f(info.params, s.params[0], s.params[1], s.params[2], s.params[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return !gl.isContextLost();
};

// WebGL yoksa: tema renginde sade bir halka
const drawFallback = (ctx: CanvasRenderingContext2D, size: number, accent: RGB) => {
    const k = size / 260;
    ctx.setTransform(k, 0, 0, k, size / 2, size / 2);
    const g = ctx.createLinearGradient(-100, -100, 100, 100);
    g.addColorStop(0, `rgb(${accent.join(',')})`);
    g.addColorStop(1, '#111');
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, Math.PI * 2);
    ctx.arc(0, 0, 71.5, 0, Math.PI * 2, true);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
};

export const mountShaderFrame = (canvas: HTMLCanvasElement, id: ShaderFrameId): (() => void) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    const def = DEFS[id];
    const state: ShaderState = { t: 0, accent: readAccent(canvas, ctx), params: [0, 0, -1, 0] };
    let frames = 0;

    const draw = () => {
        // Shader maliyeti piksel sayısıyla büyür: yoğunluk 1.75x ile ve kenar 560 pikselle sınırlı
        const size = Math.min(560, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 1.75)));
        if (!size) return;
        if (canvas.width !== size) { canvas.width = size; canvas.height = size; }
        ctx.clearRect(0, 0, size, size);
        const r = getRenderer();
        if (!r || !renderShader(r, id, size, state)) {
            drawFallback(ctx, size, state.accent);
            return;
        }
        ctx.drawImage(r.canvas, 0, r.canvas.height - size, size, size, 0, 0, size, size);
    };

    const advance = (dt: number) => {
        state.t += dt;
        def.advance?.(state, dt);
    };

    return driveFrame(canvas, {
        tick: dt => {
            if (frames++ % 45 === 0) state.accent = readAccent(canvas, ctx);
            advance(dt);
            draw();
        },
        still: () => {
            if (state.t === 0) for (let i = 0; i < 100; i++) advance(1 / 30);
            state.accent = readAccent(canvas, ctx);
            draw();
        },
    });
};
