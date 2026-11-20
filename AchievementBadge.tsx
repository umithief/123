import React, { useEffect, useInsertionEffect, useRef } from 'react';
import { BadgeMotif, BadgeTier, mountBadge } from './achievementBadges';

// Başarım rozeti: animasyonlu altıgen rozet, uygulamanın ikonu ortada.
// <AchievementBadge tier="elite" motif="night" size={96}><Moon /></AchievementBadge>
// Kilitli rozette progress (0-100) çevrede ilerleme çizgisi olarak görünür.
// celebrateKey değiştiğinde kazanma animasyonu oynar (ör. rozet kazanıldığı an).

const BADGE_STYLES = `
    .mvb-root { position: relative; flex-shrink: 0; }
    .mvb-canvas { position: absolute; left: -15%; top: -15%; width: 130%; height: 130%; max-width: none; pointer-events: none; }
    .mvb-icon { position: absolute; left: 50%; top: 50%; width: 32%; height: 32%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; }
    .mvb-icon > svg { width: 100%; height: 100%; }
    .mvb-icon--elite { --mvb-glow: rgba(240, 222, 160, .75); color: #ece4b6; animation: mvb-glow 3s ease-in-out infinite; }
    .mvb-icon--mythic { --mvb-glow: rgba(255, 90, 140, .9); color: #ffa3c0; animation: mvb-glow 2.2s ease-in-out infinite; }
    .mvb-icon--locked { color: #ffffff; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .25)); animation: mvb-jiggle 6s ease-in-out infinite; }
    .mvb-pop { animation: mvb-pop .7s cubic-bezier(.2, 1.6, .4, 1), mvb-glow 2.6s ease-in-out .7s infinite; }
    .mvb-icon--locked.mvb-pop { animation: none; }
    @keyframes mvb-glow {
        0%, 100% { filter: drop-shadow(0 0 2px var(--mvb-glow)); }
        50% { filter: drop-shadow(0 0 7px var(--mvb-glow)) brightness(1.15); }
    }
    /* Kilit birkaç saniyede bir hafifçe sallanır */
    @keyframes mvb-jiggle {
        0%, 86%, 100% { transform: translate(-50%, -50%) rotate(0); }
        89% { transform: translate(-50%, -50%) rotate(-9deg); }
        92% { transform: translate(-50%, -50%) rotate(7deg); }
        95% { transform: translate(-50%, -50%) rotate(-4deg); }
        97% { transform: translate(-50%, -50%) rotate(2deg); }
    }
    @keyframes mvb-pop {
        0% { transform: translate(-50%, -50%) scale(.4); }
        100% { transform: translate(-50%, -50%) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
        .mvb-icon { animation: none !important; }
    }
`;

let stylesInjected = false;

const useBadgeStyles = () => {
    useInsertionEffect(() => {
        if (stylesInjected) return;
        const style = document.createElement('style');
        style.id = 'mv-achievement-badge-styles';
        style.innerHTML = BADGE_STYLES;
        document.head.appendChild(style);
        stylesInjected = true;
    }, []);
};

interface AchievementBadgeProps {
    tier: BadgeTier;
    motif?: BadgeMotif;
    progress?: number; // 0-100, yalnızca kilitli rozette
    progressColor?: string; // #rrggbb, kilitli rozetin ilerleme rengi
    size?: number;
    celebrateKey?: string | number;
    className?: string;
    children?: React.ReactNode; // ortadaki ikon (ör. lucide-react)
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
    tier,
    motif = 'pulse',
    progress = 0,
    progressColor,
    size = 96,
    celebrateKey,
    className = '',
    children,
}) => {
    useBadgeStyles();
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => (ref.current ? mountBadge(ref.current, tier) : undefined), [tier]);

    return (
        <div className={`mvb-root ${className}`} style={{ width: size, height: size }}>
            <canvas
                ref={ref}
                className="mvb-canvas"
                data-motif={motif}
                data-progress={progress}
                data-color={progressColor}
                data-burst={celebrateKey}
                aria-hidden="true"
            />
            <div key={celebrateKey} className={`mvb-icon mvb-icon--${tier}${celebrateKey !== undefined ? ' mvb-pop' : ''}`}>
                {children}
            </div>
        </div>
    );
};
