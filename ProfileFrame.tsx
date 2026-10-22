import React, { useId, useInsertionEffect } from 'react';
import { ProfileFrameId, User } from '../../types';

// Profil fotoğrafı için animasyonlu motosiklet kimlikli dış çerçeveler.
// Tüm çerçeveler 200x200'lük bir SVG koordinat sisteminde çizilir; avatar ortadaki
// r=71'lik daireye oturur, çerçeve r=70..100 bandını kullanır.

export interface ProfileFrameOption {
    id: ProfileFrameId;
    name: string;
    description: string;
    rank: User['rank']; // Çerçevenin kilidinin açıldığı rütbe
}

export const DEFAULT_PROFILE_FRAME: ProfileFrameId = 'tachometer';

export const PROFILE_FRAMES: ProfileFrameOption[] = [
    { id: 'none', name: 'Çerçevesiz', description: 'Sade profil fotoğrafı', rank: 'Scooter Çırağı' },
    { id: 'tachometer', name: 'Takometre', description: 'XP ilerlemene göre devirlenen ibre', rank: 'Scooter Çırağı' },
    { id: 'tire', name: 'Lastik', description: 'Dönen yarış lastiği ve jant şeridi', rank: 'Scooter Çırağı' },
    { id: 'led-halo', name: 'Gece Sürüşü', description: 'Angel-eye far ve ardışık sinyal', rank: 'Scooter Çırağı' },
    { id: 'chain', name: 'Zincir & Dişli', description: 'Eloksal dişli üzerinde dönen zincir', rank: 'Viraj Ustası' },
    { id: 'brake-disc', name: 'Fren Diski', description: 'Frenlemede ısınan papatya disk', rank: 'Viraj Ustası' },
    { id: 'exhaust', name: 'Titanyum Egzoz', description: 'Yanık titanyum ve egzoz alevleri', rank: 'Yol Kaptanı' },
    { id: 'checkered', name: 'Damalı Bayrak', description: 'Yol kaptanlarına özel P1 çerçevesi', rank: 'Yol Kaptanı' },
];

const RANK_ORDER: User['rank'][] = ['Scooter Çırağı', 'Viraj Ustası', 'Yol Kaptanı'];

export const isProfileFrameUnlocked = (option: ProfileFrameOption, user: Pick<User, 'rank' | 'isAdmin'>) =>
    !!user.isAdmin || Math.max(0, RANK_ORDER.indexOf(user.rank)) >= RANK_ORDER.indexOf(option.rank);

// --- GEOMETRY HELPERS ---

const ACCENT = 'var(--moto-accent, #F2A619)';
const round = (n: number) => Math.round(n * 100) / 100;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// Saat 3 yönünden saat yönünde derece (SVG'de y aşağı doğru)
const xy = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [round(100 + r * Math.cos(rad)), round(100 + r * Math.sin(rad))];
};

const polar = (r: number, deg: number) => xy(r, deg).join(' ');

// Çember üzerinde n eşit hücre için dash uzunluğu (circle'da pathLength her tarayıcıda güvenilir değil)
const cell = (r: number, n: number) => round((2 * Math.PI * r) / n);

const arc = (r: number, from: number, to: number) =>
    `M ${polar(r, from)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${polar(r, to)}`;

const at = (deg: number) => `rotate(${round(deg)} 100 100)`;

// --- STATIC SHAPES (bir kez hesaplanır) ---

const TACH_START = 135;
const TACH_SWEEP = 270;
const TACH_REDLINE = TACH_START + (11 * TACH_SWEEP) / 13;

// 30 dişli zincir dişlisi + avatar için ortadaki boşluk
const SPROCKET_PATH = range(30).map(i => {
    const c = i * 12;
    return `${i === 0 ? 'M' : 'L'} ${polar(88, c - 2.4)} L ${polar(88, c + 2.4)} L ${polar(82, c + 4.2)} L ${polar(82, c + 7.8)}`;
}).join(' ') + ' Z M 170 100 A 70 70 0 1 0 30 100 A 70 70 0 1 0 170 100 Z';

// 12 yapraklı (wave) fren diski
const BRAKE_DISC_PATH = range(120).map(i => {
    const deg = i * 3;
    const r = 94.5 + 3.5 * Math.cos((12 * deg * Math.PI) / 180);
    return `${i === 0 ? 'M' : 'L'} ${polar(r, deg)}`;
}).join(' ') + ' Z M 179 100 A 79 79 0 1 0 21 100 A 79 79 0 1 0 179 100 Z';

// Tepeye bakan alev (taban y=21 → r=79, uç y=0.6 → r=99.4)
const FLAME_OUTER = 'M 92 21 C 90.5 15 93.5 11.5 95.5 7.5 C 96.2 10 97.6 11 98.4 11.4 C 97.8 7.2 99.4 3.4 102 0.6 C 102.2 5 105.2 7.6 105.6 11 C 106.6 10 107.2 8.6 107.2 7.4 C 109.8 11.4 109.6 16.6 108 21 Z';
const FLAME_CORE = 'M 96.4 21 C 95.8 17.4 97.2 15.2 98.4 13.4 C 98.8 15.4 99.9 15.9 100.4 16.1 C 100.4 14.2 101.5 12.6 102.4 11.6 C 102.9 14.6 104.3 16.8 103.6 21 Z';

// --- FRAMES ---

const Tachometer: React.FC<{ id: string }> = ({ id }) => (
    <>
        <defs>
            <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fafafa" />
                <stop offset=".45" stopColor="#71717a" />
                <stop offset=".6" stopColor="#3f3f46" />
                <stop offset="1" stopColor="#d4d4d8" />
            </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#0d0d10" strokeWidth="28" />
        <circle cx="100" cy="100" r="97" fill="none" stroke={`url(#${id}-bezel)`} strokeWidth="4" />
        <circle cx="100" cy="100" r="71.5" fill="none" stroke="#2a2a30" strokeWidth="3" />

        {/* LED devir barı */}
        <path d={arc(84, TACH_START, TACH_START + TACH_SWEEP)} fill="none" stroke="#26262c" strokeWidth="10" />
        <path
            className="mvf-tach-lit"
            d={arc(84, TACH_START, TACH_START + TACH_SWEEP)}
            pathLength={100}
            strokeDasharray="100 100"
            fill="none"
            strokeWidth="10"
            style={{ stroke: ACCENT }}
        />
        <path d={arc(84, TACH_REDLINE, TACH_START + TACH_SWEEP)} fill="none" stroke="#ef4444" strokeWidth="10" opacity=".35" />
        {range(37).map(i => (
            <line key={i} x1="100" y1="21" x2="100" y2="10.5" stroke="#0d0d10" strokeWidth="1.4" transform={at(TACH_START + 90 + i * 7.5)} />
        ))}

        {/* Kadran çizgileri ve kırmızı bölge */}
        <path d={arc(92.5, TACH_REDLINE, TACH_START + TACH_SWEEP)} fill="none" stroke="#ef4444" strokeWidth="3.5" />
        {range(27).map(i => {
            const deg = TACH_START + (i * TACH_SWEEP) / 26;
            const major = i % 2 === 0;
            return (
                <line
                    key={i}
                    x1="100" y1={major ? 5.5 : 6} x2="100" y2={major ? 9.5 : 8}
                    stroke={deg >= TACH_REDLINE - 0.01 ? '#fecaca' : '#e4e4e7'}
                    strokeWidth={major ? 1.4 : 0.7}
                    transform={at(deg + 90)}
                />
            );
        })}

        {/* İbre */}
        <g className="mvf-tach-needle" style={{ filter: 'drop-shadow(0 0 2px rgba(255,59,48,.9))' }}>
            <polygon points={`${polar(98, TACH_START)} ${polar(75, TACH_START - 2.4)} ${polar(73, TACH_START)} ${polar(75, TACH_START + 2.4)}`} fill="#ff3b30" />
            <path d={`M ${polar(74, TACH_START)} L ${polar(96, TACH_START)}`} stroke="#fff" strokeWidth=".6" opacity=".7" />
        </g>

        {/* Vites uyarı ışığı ve boş vites göstergesi */}
        <circle className="mvf-tach-shift" cx="100" cy="3.2" r="2.6" fill="#ef4444" />
        <rect x="89" y="177" width="22" height="15" rx="4" fill="#050507" stroke="#3f3f46" strokeWidth=".8" />
        <text x="100" y="188.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="#22c55e" style={{ filter: 'drop-shadow(0 0 2px #22c55e)' }}>N</text>
    </>
);

const Tire: React.FC<{ id: string }> = ({ id }) => (
    <>
        <defs>
            <radialGradient id={`${id}-rubber`} gradientUnits="userSpaceOnUse" cx="100" cy="100" r="100">
                <stop offset=".7" stopColor="#3a3a40" />
                <stop offset=".8" stopColor="#1c1c20" />
                <stop offset=".93" stopColor="#111113" />
                <stop offset="1" stopColor="#050505" />
            </radialGradient>
            <path id={`${id}-sidewall`} d="M 100 20 A 80 80 0 1 1 99.99 20" />
        </defs>
        <g className="mvf-spin" style={{ animationDuration: '5s' }}>
            <circle cx="100" cy="100" r="85" fill="none" stroke={`url(#${id}-rubber)`} strokeWidth="28" />
            {range(24).map(i => (
                <g key={i} transform={at(i * 15)} strokeLinecap="round" fill="none">
                    <path d="M 98.6 3 Q 100.6 7 97.4 12 M 104 3.4 L 102.8 7.2" stroke="#3a3a41" strokeWidth="2.8" />
                    <path d="M 98.6 3 Q 100.6 7 97.4 12 M 104 3.4 L 102.8 7.2" stroke="#050505" strokeWidth="1.6" />
                </g>
            ))}
            <text fontSize="7.5" fontWeight="800" fill="#a1a1aa">
                <textPath href={`#${id}-sidewall`} textLength="500" lengthAdjust="spacing">
                    180/55 ZR17 • RADIAL • TUBELESS • 180/55 ZR17 • RADIAL • TUBELESS •
                </textPath>
            </text>
            <circle cx="100" cy="100" r="71.5" fill="none" stroke="#e4e4e7" strokeWidth="3" />
            <circle cx="100" cy="100" r="74.2" fill="none" strokeWidth="1.6" strokeDasharray={`${cell(74.2, 5)} ${cell(74.2, 20)}`} style={{ stroke: ACCENT }} />
        </g>
    </>
);

const LedHalo: React.FC<{ id: string }> = ({ id }) => (
    <>
        <defs>
            <radialGradient id={`${id}-housing`} gradientUnits="userSpaceOnUse" cx="100" cy="100" r="100">
                <stop offset=".7" stopColor="#27272a" />
                <stop offset=".85" stopColor="#09090b" />
                <stop offset="1" stopColor="#18181b" />
            </radialGradient>
            <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset=".5" stopColor="#52525b" />
                <stop offset="1" stopColor="#e4e4e7" />
            </linearGradient>
            <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <circle cx="100" cy="100" r="85.5" fill="none" stroke={`url(#${id}-housing)`} strokeWidth="28" />
        <circle cx="100" cy="100" r="98.6" fill="none" stroke={`url(#${id}-chrome)`} strokeWidth="2.4" />

        {/* Angel-eye halka ve üzerinde dolaşan beyaz DRL ışığı */}
        <circle className="mvf-breathe" cx="100" cy="100" r="74" fill="none" strokeWidth="8" opacity=".25" style={{ stroke: ACCENT }} />
        <circle className="mvf-breathe" cx="100" cy="100" r="74" fill="none" strokeWidth="3.2" filter={`url(#${id}-glow)`} style={{ stroke: ACCENT }} />
        <circle className="mvf-spin" cx="100" cy="100" r="74" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={`${cell(74, 12)} ${cell(74, 12 / 11)}`} filter={`url(#${id}-glow)`} style={{ animationDuration: '2.4s' }} />

        {/* Ardışık (kayan) sinyal LED'leri */}
        {range(36).map(i => (
            <circle
                key={i}
                className="mvf-led"
                cx="100" cy="9" r="1.7"
                fill="#fbbf24"
                transform={at(i * 10)}
                style={{ animationDelay: `${round((i * 1.6) / 36 - 1.6)}s` }}
            />
        ))}
    </>
);

const ChainSprocket: React.FC<{ id: string }> = ({ id }) => (
    <>
        <defs>
            <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity=".55" />
                <stop offset=".5" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity=".35" />
            </linearGradient>
            <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d4d4d8" />
                <stop offset=".5" stopColor="#52525b" />
                <stop offset="1" stopColor="#a1a1aa" />
            </linearGradient>
            <radialGradient id={`${id}-pin`}>
                <stop offset="0" stopColor="#fafafa" />
                <stop offset="1" stopColor="#71717a" />
            </radialGradient>
            <mask id={`${id}-holes`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
                <rect width="200" height="200" fill="#fff" />
                {range(6).map(i => <circle key={i} cx="100" cy="23.5" r="2.6" fill="#000" transform={at(i * 60 + 30)} />)}
            </mask>
        </defs>
        <g className="mvf-spin" style={{ animationDuration: '10s' }}>
            <g mask={`url(#${id}-holes)`}>
                <path d={SPROCKET_PATH} fillRule="evenodd" style={{ fill: ACCENT }} stroke="rgba(0,0,0,.25)" strokeWidth=".6" strokeLinejoin="round" />
                <path d={SPROCKET_PATH} fillRule="evenodd" fill={`url(#${id}-sheen)`} />
            </g>
            {range(6).map(i => (
                <g key={i} transform={at(i * 60)}>
                    <circle cx="100" cy="23.5" r="2.8" fill={`url(#${id}-steel)`} />
                    <polygon points="100,21.9 101.4,22.7 101.4,24.3 100,25.1 98.6,24.3 98.6,22.7" fill="#3f3f46" />
                </g>
            ))}

            {/* Zincir: iç baklalar, dış baklalar ve pimler */}
            <circle cx="100" cy="100" r="93.5" fill="none" stroke="#27272a" strokeWidth="6.4" />
            <circle cx="100" cy="100" r="93.5" fill="none" stroke={`url(#${id}-steel)`} strokeWidth="8.6" strokeDasharray={cell(93.5, 36)} strokeDashoffset={-cell(93.5, 72)} />
            {range(36).map(i => (
                <circle key={i} cx="100" cy="6.5" r="2.3" fill={`url(#${id}-pin)`} stroke="#3f3f46" strokeWidth=".5" transform={at(i * 10 + 5)} />
            ))}
        </g>
    </>
);

const BrakeDisc: React.FC<{ id: string }> = ({ id }) => (
    <>
        <defs>
            <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f4f4f5" />
                <stop offset=".35" stopColor="#a1a1aa" />
                <stop offset=".55" stopColor="#e4e4e7" />
                <stop offset="1" stopColor="#71717a" />
            </linearGradient>
            <radialGradient id={`${id}-heat`} gradientUnits="userSpaceOnUse" cx="100" cy="100" r="98">
                <stop offset=".82" stopColor="#f97316" stopOpacity="0" />
                <stop offset=".9" stopColor="#f97316" stopOpacity=".8" />
                <stop offset="1" stopColor="#ef4444" />
            </radialGradient>
            <linearGradient id={`${id}-caliper`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f87171" />
                <stop offset=".5" stopColor="#dc2626" />
                <stop offset="1" stopColor="#7f1d1d" />
            </linearGradient>
        </defs>
        <g className="mvf-brake-disc">
            <path d={BRAKE_DISC_PATH} fillRule="evenodd" fill={`url(#${id}-steel)`} stroke="#71717a" strokeWidth=".6" />
            <circle cx="100" cy="100" r="82" fill="none" stroke="#fff" strokeWidth=".5" opacity=".5" />
            <circle cx="100" cy="100" r="87" fill="none" stroke="#fff" strokeWidth=".5" opacity=".5" />
            <path className="mvf-brake-heat" d={BRAKE_DISC_PATH} fillRule="evenodd" fill={`url(#${id}-heat)`} />
            {range(24).map(i => (
                <g key={i} fill="#27272a">
                    <circle cx="100" cy="16" r="1.6" transform={at(i * 15)} />
                    <circle cx="100" cy="10.5" r="1.6" transform={at(i * 15 + 7.5)} />
                </g>
            ))}

            {/* Yüzer disk taşıyıcısı ve perçinler */}
            <circle cx="100" cy="100" r="74.5" fill="none" strokeWidth="9" style={{ stroke: ACCENT }} />
            {range(10).map(i => (
                <g key={i} transform={at(i * 36)}>
                    <circle cx="100" cy="21" r="2.8" fill="#e4e4e7" stroke="#52525b" strokeWidth=".6" />
                    <circle cx="100" cy="21" r="1" fill="#52525b" />
                </g>
            ))}
        </g>

        {/* Sabit kaliper */}
        <path
            d={`M ${polar(96, -66)} A 96 96 0 0 1 ${polar(96, -24)} L ${polar(81, -24)} A 81 81 0 0 0 ${polar(81, -66)} Z`}
            fill={`url(#${id}-caliper)`}
            stroke={`url(#${id}-caliper)`}
            strokeWidth="3"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,.45))' }}
        />
        <path d={arc(93.5, -61, -29)} fill="none" stroke="#fff" strokeWidth=".8" strokeLinecap="round" opacity=".5" />
        {[-58, -32].map(deg => {
            const [cx, cy] = xy(88.5, deg);
            return <circle key={deg} cx={cx} cy={cy} r="1.8" fill="#e4e4e7" />;
        })}
    </>
);

const Exhaust: React.FC<{ id: string }> = ({ id }) => (
    <>
        <defs>
            <linearGradient id={`${id}-flame`} gradientUnits="userSpaceOnUse" x1="0" y1="21" x2="0" y2="0.6">
                <stop offset="0" stopColor="#ef4444" />
                <stop offset=".45" stopColor="#f97316" />
                <stop offset=".8" stopColor="#fde047" />
                <stop offset="1" stopColor="#fef9c3" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-core`} gradientUnits="userSpaceOnUse" x1="0" y1="21" x2="0" y2="11">
                <stop offset="0" stopColor="#3b82f6" />
                <stop offset="1" stopColor="#e0f2fe" />
            </linearGradient>
            <linearGradient id={`${id}-titanium`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e7e5e4" />
                <stop offset=".18" stopColor="#f5d08a" />
                <stop offset=".36" stopColor="#c084fc" />
                <stop offset=".52" stopColor="#3b82f6" />
                <stop offset=".68" stopColor="#a78bfa" />
                <stop offset=".84" stopColor="#fcd34d" />
                <stop offset="1" stopColor="#d6d3d1" />
            </linearGradient>
        </defs>

        {/* Egzoz alevleri */}
        {range(20).map(i => (
            <g key={i} transform={`${at(i * 18)}${i % 2 ? ' translate(100 21) scale(.72) translate(-100 -21)' : ''}`}>
                <g className="mvf-flame" style={{ animationDelay: `${round(-i * 0.13)}s`, animationDuration: `${round(0.8 + (i % 3) * 0.17)}s` }}>
                    <path d={FLAME_OUTER} fill={`url(#${id}-flame)`} />
                    <path d={FLAME_CORE} fill={`url(#${id}-core)`} opacity=".85" />
                </g>
            </g>
        ))}

        {/* Yanık titanyum boru ve kaynak dikişleri */}
        <g className="mvf-spin" style={{ animationDuration: '9s' }}>
            <circle cx="100" cy="100" r="78" fill="none" stroke={`url(#${id}-titanium)`} strokeWidth="12" />
            <circle cx="100" cy="100" r="73.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeDasharray=".1 2.2" opacity=".75" />
            <circle cx="100" cy="100" r="82.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeDasharray=".1 2.2" opacity=".75" />
        </g>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#57534e" strokeWidth=".6" opacity=".6" />
        <circle cx="100" cy="100" r="71.2" fill="none" stroke="#e7e5e4" strokeWidth="2.4" />
    </>
);

const Checkered: React.FC<{ id: string }> = () => (
    <>
        <g className="mvf-spin" style={{ animationDuration: '24s' }}>
            <circle cx="100" cy="100" r="74" fill="none" stroke="#0a0a0a" strokeWidth="8" />
            <circle cx="100" cy="100" r="88" fill="none" stroke="#0a0a0a" strokeWidth="20" />
            <circle cx="100" cy="100" r="83" fill="none" stroke="#fafafa" strokeWidth="10" strokeDasharray={cell(83, 40)} />
            <circle cx="100" cy="100" r="93" fill="none" stroke="#fafafa" strokeWidth="10" strokeDasharray={cell(93, 40)} strokeDashoffset={cell(93, 40)} />
        </g>
        <circle className="mvf-spin" cx="100" cy="100" r="88" fill="none" stroke="#fff" strokeWidth="20" opacity=".22" strokeDasharray={`${cell(88, 10)} ${cell(88, 10 / 9)}`} style={{ animationDuration: '3.5s' }} />
        <circle cx="100" cy="100" r="77.5" fill="none" strokeWidth="2.6" style={{ stroke: ACCENT }} />
        <circle cx="100" cy="100" r="98.4" fill="none" stroke="#0a0a0a" strokeWidth="2" />

        {/* P1 rozeti */}
        <rect x="83" y="1.5" width="34" height="15" rx="7.5" stroke="#0a0a0a" strokeWidth="1.6" style={{ fill: ACCENT }} />
        <text x="100" y="12.6" textAnchor="middle" fontSize="10" fontWeight="900" fontStyle="italic" fill="#0a0a0a">P1</text>
    </>
);

const FRAME_RENDERERS: Record<Exclude<ProfileFrameId, 'none'>, React.FC<{ id: string }>> = {
    'tachometer': Tachometer,
    'tire': Tire,
    'led-halo': LedHalo,
    'chain': ChainSprocket,
    'brake-disc': BrakeDisc,
    'exhaust': Exhaust,
    'checkered': Checkered,
};

// --- STYLES ---

const FRAME_STYLES = `
    .mvf-root { position: relative; flex-shrink: 0; }
    .mvf-avatar { position: absolute; border-radius: 9999px; overflow: hidden; background: #f4f4f5; transition: transform .3s ease; }
    .mvf-avatar > * { width: 100% !important; height: 100% !important; }
    .mvf-avatar svg, .mvf-avatar img { display: block; width: 100%; height: 100%; object-fit: cover; }
    .mvf-root:hover .mvf-avatar { transform: scale(.96); }
    .mvf-plain { box-shadow: 0 0 0 4px #fff, 0 6px 16px rgba(0,0,0,.18); }
    .mvf-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    .mvf-spin, .mvf-tach-needle, .mvf-brake-disc { transform-box: view-box; transform-origin: 50% 50%; }

    .mvf-spin { animation: mvf-spin 6s linear infinite; }
    @keyframes mvf-spin { to { transform: rotate(360deg); } }

    .mvf-tach-needle {
        transform: rotate(calc(var(--mvf-p) * 2.7deg));
        animation: mvf-tach-needle-sweep 1.8s cubic-bezier(.4,0,.2,1), mvf-tach-needle-rev 6s ease-in-out 1.8s infinite;
    }
    .mvf-tach-lit {
        stroke-dashoffset: calc((100 - var(--mvf-p)) * 1px);
        animation: mvf-tach-lit-sweep 1.8s cubic-bezier(.4,0,.2,1), mvf-tach-lit-rev 6s ease-in-out 1.8s infinite;
    }
    .mvf-tach-shift { opacity: .15; animation: mvf-tach-shift 6s linear 1.8s infinite; }
    @keyframes mvf-tach-needle-sweep {
        0% { transform: rotate(0deg); }
        45% { transform: rotate(270deg); }
    }
    @keyframes mvf-tach-needle-rev {
        0%, 46%, 84%, 100% { transform: rotate(calc(var(--mvf-p) * 2.7deg)); }
        12% { transform: rotate(calc(var(--mvf-p) * 2.7deg + 2deg)); }
        24% { transform: rotate(calc(var(--mvf-p) * 2.7deg - 1.5deg)); }
        36% { transform: rotate(calc(var(--mvf-p) * 2.7deg + 1deg)); }
        56% { transform: rotate(258deg); }
        61% { transform: rotate(247deg); }
        66% { transform: rotate(262deg); }
        71% { transform: rotate(249deg); }
    }
    @keyframes mvf-tach-lit-sweep {
        0% { stroke-dashoffset: 100px; }
        45% { stroke-dashoffset: 0px; }
    }
    @keyframes mvf-tach-lit-rev {
        0%, 46%, 84%, 100% { stroke-dashoffset: calc((100 - var(--mvf-p)) * 1px); }
        12% { stroke-dashoffset: calc((100 - var(--mvf-p)) * 1px - .75px); }
        24% { stroke-dashoffset: calc((100 - var(--mvf-p)) * 1px + .55px); }
        36% { stroke-dashoffset: calc((100 - var(--mvf-p)) * 1px - .35px); }
        56% { stroke-dashoffset: 4.4px; }
        61% { stroke-dashoffset: 8.5px; }
        66% { stroke-dashoffset: 3px; }
        71% { stroke-dashoffset: 7.8px; }
    }
    @keyframes mvf-tach-shift {
        0%, 54%, 74%, 100% { opacity: .15; }
        56%, 60%, 66% { opacity: 1; }
        58%, 63%, 70% { opacity: .3; }
    }

    .mvf-breathe { animation: mvf-breathe 2.4s ease-in-out infinite; }
    @keyframes mvf-breathe { 50% { opacity: .55; } }
    .mvf-led { opacity: .18; animation: mvf-led 1.6s linear infinite; }
    @keyframes mvf-led {
        0%, 50% { opacity: 1; }
        18%, 46%, 68%, 100% { opacity: .18; }
    }

    .mvf-brake-disc { animation: mvf-brake 4.2s infinite; }
    @keyframes mvf-brake {
        0% { transform: rotate(0deg); animation-timing-function: cubic-bezier(.5,0,1,1); }
        35% { transform: rotate(540deg); animation-timing-function: cubic-bezier(0,0,.45,1); }
        75%, 100% { transform: rotate(1080deg); }
    }
    .mvf-brake-heat { opacity: 0; animation: mvf-heat 4.2s ease-in-out infinite; }
    @keyframes mvf-heat {
        0%, 35% { opacity: 0; }
        72% { opacity: .55; }
        100% { opacity: 0; }
    }

    .mvf-flame { transform-box: fill-box; transform-origin: 50% 100%; animation: mvf-flicker 1s ease-in-out infinite alternate; }
    @keyframes mvf-flicker {
        0% { transform: scale(1, 1); }
        25% { transform: scale(.92, 1.14); }
        50% { transform: scale(1.06, .84); }
        75% { transform: scale(.95, 1.06); }
        100% { transform: scale(1, .92); }
    }

    @media (prefers-reduced-motion: reduce) {
        .mvf-root * { animation: none !important; }
    }
`;

let stylesInjected = false;

const useFrameStyles = () => {
    useInsertionEffect(() => {
        if (stylesInjected) return;
        const style = document.createElement('style');
        style.id = 'mv-profile-frame-styles';
        style.innerHTML = FRAME_STYLES;
        document.head.appendChild(style);
        stylesInjected = true;
    }, []);
};

// --- COMPONENT ---

interface ProfileFrameProps {
    frame?: ProfileFrameId;
    progress?: number; // 0-100, takometre ibresinin rölanti konumu
    size?: number;
    className?: string;
    children: React.ReactNode;
}

export const ProfileFrame: React.FC<ProfileFrameProps> = ({
    frame = DEFAULT_PROFILE_FRAME,
    progress = 60,
    size,
    className = '',
    children
}) => {
    useFrameStyles();
    const id = `mvf${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const Frame = frame === 'none' ? null : FRAME_RENDERERS[frame];
    const style = {
        width: size,
        height: size,
        '--mvf-p': Math.max(0, Math.min(100, progress)),
    } as React.CSSProperties;

    return (
        <div className={`mvf-root ${className}`} style={style}>
            <div className={`mvf-avatar ${Frame ? '' : 'mvf-plain'}`} style={{ inset: Frame ? '14.5%' : 0 }}>
                {children}
            </div>
            {Frame && (
                <svg className="mvf-svg" viewBox="0 0 200 200" aria-hidden="true">
                    <Frame id={id} />
                </svg>
            )}
        </div>
    );
};
