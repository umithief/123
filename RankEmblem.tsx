import React, { useEffect, useRef } from 'react';
import { EmblemTier, mountRankEmblem } from './rankEmblems';

// Rütbe amblemi: kariyer yolundaki kademe için hareketli arma.
// <RankEmblem tier={emblemTierForApex(user.apex)} size={180} />
// Mavi tonlar tema renginden (--moto-accent) gelir; huzme, kanat ve alevler kutunun %15 dışına taşabilir.

interface RankEmblemProps {
    tier: EmblemTier;
    size?: number;
    className?: string;
}

export const RankEmblem: React.FC<RankEmblemProps> = ({ tier, size = 160, className = '' }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => (ref.current ? mountRankEmblem(ref.current, tier) : undefined), [tier]);
    return (
        <div className={className} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <canvas
                ref={ref}
                aria-hidden="true"
                style={{ position: 'absolute', left: '-15%', top: '-15%', width: '130%', height: '130%', maxWidth: 'none', pointerEvents: 'none' }}
            />
        </div>
    );
};
