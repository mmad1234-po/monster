import React, { useState } from 'react';
import { Monster, ElementType } from '../types';
import { getMonsterArtwork } from '../data/gameData';
import { sounds } from '../utils/audio';
import { Crown, Sparkles } from 'lucide-react';

interface MonsterRendererProps {
  monster: Monster;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'battle' | 'portrait';
  animationState?: 'idle' | 'attack' | 'hit' | 'victory' | 'defeated';
  showStatsTooltip?: boolean;
  className?: string;
  isEnemy?: boolean;
  forceSvg?: boolean;
  interactiveRoar?: boolean;
  minimal?: boolean;
}

export const MonsterRenderer: React.FC<MonsterRendererProps> = ({
  monster,
  size = 'md',
  animationState = 'idle',
  className = '',
  isEnemy = false,
  forceSvg = false,
  interactiveRoar = true,
  minimal = false,
}) => {
  const [isRoaring, setIsRoaring] = useState(false);
  const { cosmetics, element, evolutionStage } = monster;
  const bodyColor = cosmetics.bodyColor || '#ef4444';
  const glowColor = cosmetics.glowColor || '#fbbf24';
  const hornType = cosmetics.hornType || 'dragon';
  const auraEffect = cosmetics.auraEffect || 'flames';

  // Resolved Artwork
  const artworkUrl = getMonsterArtwork(element, monster.imageUrl);

  // Dimension scaling
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-60 h-60',
    battle: 'w-56 h-56 md:w-72 md:h-72',
    portrait: 'w-full h-full min-h-[260px]',
  };

  // Animation class
  let animClass = 'animate-float-bob';
  if (animationState === 'attack') {
    animClass = isEnemy ? 'animate-attack-enemy' : 'animate-attack-player';
  } else if (animationState === 'hit') {
    animClass = 'animate-hit-shake filter brightness-150 saturate-150';
  } else if (animationState === 'victory') {
    animClass = 'animate-bounce';
  } else if (animationState === 'defeated') {
    animClass = 'opacity-35 grayscale rotate-12 scale-90 transition-all duration-700';
  }

  if (isRoaring) {
    animClass = 'scale-110 -translate-y-2 brightness-125 filter drop-shadow(0 0 30px rgba(251, 191, 36, 0.9)) transition-all duration-300';
  }

  // Element specific styling
  const elementThemes: Record<ElementType, {
    gemColor: string;
    pedestalRune: string;
    pedestalBorder: string;
    ambientGlow: string;
    softGradient: string;
  }> = {
    fire: {
      gemColor: 'from-amber-400 to-rose-600',
      pedestalRune: 'from-rose-500/30 via-amber-500/20 to-transparent',
      pedestalBorder: '#f87171',
      ambientGlow: '0 10px 30px rgba(239, 68, 68, 0.35)',
      softGradient: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 75%)',
    },
    water: {
      gemColor: 'from-cyan-300 to-blue-600',
      pedestalRune: 'from-cyan-500/30 via-blue-500/20 to-transparent',
      pedestalBorder: '#38bdf8',
      ambientGlow: '0 10px 30px rgba(6, 182, 212, 0.35)',
      softGradient: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 75%)',
    },
    thunder: {
      gemColor: 'from-yellow-300 to-amber-600',
      pedestalRune: 'from-amber-400/30 via-yellow-400/20 to-transparent',
      pedestalBorder: '#facc15',
      ambientGlow: '0 10px 30px rgba(234, 179, 8, 0.35)',
      softGradient: 'radial-gradient(circle at center, rgba(234, 179, 8, 0.15) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 75%)',
    },
    void: {
      gemColor: 'from-purple-400 to-fuchsia-700',
      pedestalRune: 'from-purple-600/30 via-violet-600/20 to-transparent',
      pedestalBorder: '#c084fc',
      ambientGlow: '0 10px 30px rgba(168, 85, 247, 0.38)',
      softGradient: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.05) 50%, transparent 75%)',
    },
    light: {
      gemColor: 'from-amber-200 to-yellow-500',
      pedestalRune: 'from-yellow-300/30 via-amber-400/20 to-transparent',
      pedestalBorder: '#fde047',
      ambientGlow: '0 10px 35px rgba(245, 158, 11, 0.4)',
      softGradient: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.18) 0%, rgba(251, 191, 36, 0.05) 50%, transparent 75%)',
    },
    earth: {
      gemColor: 'from-emerald-300 to-green-600',
      pedestalRune: 'from-emerald-500/30 via-green-600/20 to-transparent',
      pedestalBorder: '#4ade80',
      ambientGlow: '0 10px 30px rgba(34, 197, 94, 0.35)',
      softGradient: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 75%)',
    },
  };

  const currentTheme = elementThemes[element] || elementThemes.fire;
  const stageScale = evolutionStage === 1 ? 0.96 : evolutionStage === 2 ? 1.04 : 1.12;
  const showPedestal = !minimal && (size === 'battle' || size === 'portrait' || size === 'xl' || size === 'lg');

  const handleCreatureClick = () => {
    if (!interactiveRoar) return;
    setIsRoaring(true);
    sounds.playHit(element);
    setTimeout(() => {
      setIsRoaring(false);
    }, 600);
  };

  return (
    <div 
      onClick={handleCreatureClick}
      className={`relative flex flex-col items-center justify-center select-none cursor-pointer group ${sizeMap[size]} ${className}`}
    >
      {/* Dynamic Background Atmosphere Glow */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-full blur-xl -z-10 transition-opacity duration-500"
        style={{ background: currentTheme.softGradient }}
      />

      {/* 3D Holographic Summoning Platform / Battle Base Pedestal */}
      {showPedestal && (
        <div className="absolute -bottom-5 w-full flex flex-col items-center justify-center pointer-events-none z-0">
          {/* Ground Soft Ambient Shadow */}
          <div 
            className="w-36 md:w-52 h-6 bg-slate-900/30 rounded-full blur-md"
            style={{ transform: 'rotateX(72deg)' }}
          />
          {/* Outer Glowing Rune Ring */}
          <div 
            className="w-44 md:w-56 h-12 rounded-full border border-dashed animate-spin opacity-80 -mt-7"
            style={{ 
              borderColor: currentTheme.pedestalBorder, 
              animationDuration: '18s',
              transform: 'rotateX(72deg)',
            }}
          />
          {/* Inner Light Core */}
          <div 
            className={`w-32 md:w-44 h-8 rounded-full bg-gradient-to-t ${currentTheme.pedestalRune} -mt-10 animate-pulse`}
            style={{ transform: 'rotateX(72deg)' }}
          />
        </div>
      )}

      {/* Dynamic Elemental Aura Particles */}
      {auraEffect !== 'none' && !minimal && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-0">
          {auraEffect === 'flames' && (
            <div 
              className="w-[115%] h-[115%] rounded-full animate-pulse opacity-40 mix-blend-screen"
              style={{
                background: `radial-gradient(circle, ${glowColor}50 0%, ${bodyColor}20 60%, transparent 80%)`
              }}
            />
          )}
          {auraEffect === 'lightning_sparks' && (
            <div 
              className="w-[110%] h-[110%] rounded-full border border-dashed animate-spin opacity-70"
              style={{ borderColor: glowColor, animationDuration: '8s' }}
            />
          )}
          {auraEffect === 'divine_ring' && (
            <div 
              className="w-[115%] h-[115%] rounded-full border border-amber-300/70 animate-pulse"
              style={{ boxShadow: `0 0 25px ${glowColor}50` }}
            />
          )}
          {auraEffect === 'void_particles' && (
            <div 
              className="w-[110%] h-[110%] rounded-full animate-ping opacity-20"
              style={{ background: '#a855f7', animationDuration: '4s' }}
            />
          )}
        </div>
      )}

      {/* Sovereign Titan Crown */}
      {(evolutionStage === 3 || hornType === 'crown') && !minimal && (
        <div className="absolute -top-4 z-30 flex items-center justify-center animate-bounce pointer-events-none">
          <div className="bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 p-1.5 rounded-full shadow-md border border-white flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-amber-950" />
          </div>
        </div>
      )}

      {/* Organic Borderless Creature Stage */}
      {!forceSvg ? (
        <div 
          className={`relative w-full h-full flex items-center justify-center z-10 transition-transform duration-300 ${animClass}`}
          style={{
            transform: `${isEnemy ? 'scaleX(-1)' : ''} scale(${stageScale})`,
          }}
        >
          {/* Main Creature Artwork with organic cutout aesthetic */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden drop-shadow-xl group-hover:scale-104 transition-transform duration-500">
            <img 
              src={artworkUrl} 
              alt={monster.nameFa}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain object-center filter drop-shadow(0 12px 24px rgba(0,0,0,0.18))"
            />
          </div>

          {/* Minimalist Floating Identifier (Only if not minimal mode) */}
          {!minimal && (
            <div className="absolute -bottom-2 px-3 py-0.5 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-full shadow-xs flex items-center gap-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span className="text-[11px] font-black text-slate-800">{monster.nameFa}</span>
              <span className="text-[10px] font-mono font-bold text-amber-700">سطح {monster.level}</span>
            </div>
          )}
        </div>
      ) : (
        /* Dynamic SVG Mode */
        <svg
          viewBox="0 0 200 200"
          className={`w-full h-full transform z-10 ${animClass} transition-transform duration-300 drop-shadow-lg`}
          style={{ transform: `${isEnemy ? 'scaleX(-1)' : ''} scale(${stageScale})` }}
        >
          <ellipse cx="100" cy="125" rx={44} ry={48} fill={bodyColor} stroke="#ffffff" strokeWidth="2" />
          <ellipse cx="100" cy="75" rx="38" ry="34" fill={bodyColor} stroke="#ffffff" strokeWidth="2" />
          <ellipse cx="85" cy="74" rx="7" ry="5" fill="#fef08a" />
          <circle cx="85" cy="74" r="3" fill="#ef4444" />
          <ellipse cx="115" cy="74" rx="7" ry="5" fill="#fef08a" />
          <circle cx="115" cy="74" r="3" fill="#ef4444" />
        </svg>
      )}
    </div>
  );
};
