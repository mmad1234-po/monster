import React, { useState } from 'react';
import { LeagueTier } from '../types';
import { LEAGUES, GLOBAL_LEADERBOARD_PLAYERS } from '../data/gameData';
import { sounds } from '../utils/audio';
import { 
  Trophy, 
  Award, 
  Crown, 
  Shield, 
  Flame, 
  Gem, 
  Clock, 
  Gift, 
  CheckCircle,
  Lock,
  Sparkles
} from 'lucide-react';

interface SeasonalLeaguesProps {
  playerTrophies: number;
}

export const SeasonalLeagues: React.FC<SeasonalLeaguesProps> = ({ playerTrophies }) => {
  const [activeView, setActiveView] = useState<'leagues' | 'leaderboard'>('leagues');

  // Determine current league tier
  const currentLeague = LEAGUES.slice().reverse().find((l) => playerTrophies >= l.minTrophies) || LEAGUES[0];

  const getTierIcon = (tier: LeagueTier) => {
    switch (tier) {
      case 'Bronze': return <Shield className="w-5 h-5 text-amber-700" />;
      case 'Silver': return <Shield className="w-5 h-5 text-slate-400" />;
      case 'Gold': return <Award className="w-5 h-5 text-amber-400" />;
      case 'Platinum': return <Crown className="w-5 h-5 text-teal-400" />;
      case 'Diamond': return <Gem className="w-5 h-5 text-cyan-400" />;
      case 'Master': return <Flame className="w-5 h-5 text-purple-400" />;
      case 'Grandmaster': return <Trophy className="w-5 h-5 text-rose-500 animate-pulse" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Season 8 Timer & Player Tier */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 relative overflow-hidden shadow-xl text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center">
                {getTierIcon(currentLeague.tier)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl md:text-2xl font-black text-white">فصل هشتم: خیزش تایتان‌های کهن</h2>
                <span className="text-xs bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-full shadow-md">
                  لیگ {currentLeague.tierFa}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-300 mt-1">با کسب کاپ در نبردهای آنلاین به لیگ‌های بالاتر صعود کرده و صندوق‌های پاداش اساطیری دریافت کنید.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-2xl text-xs font-black text-slate-200 shadow-md">
            <Clock className="w-4 h-4 text-amber-400" />
            زمان تا پایان فصل: <span className="text-amber-400 font-mono">14 روز و 8 ساعت</span>
          </div>
        </div>
      </div>

      {/* Switch between Leagues Roadmap & Leaderboard */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveView('leagues');
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-xs ${
            activeView === 'leagues'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200/90'
          }`}
        >
          <Award className="w-4 h-4" /> نقشه راه لیگ‌های فصلی
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveView('leaderboard');
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-xs ${
            activeView === 'leaderboard'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200/90'
          }`}
        >
          <Trophy className="w-4 h-4" /> رتبه‌بندی قهرمانان جهان (لیدربرد)
        </button>
      </div>

      {/* VIEW 1: LEAGUES ROADMAP */}
      {activeView === 'leagues' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {LEAGUES.map((league) => {
              const isCurrent = league.tier === currentLeague.tier;
              const isUnlocked = playerTrophies >= league.minTrophies;

              return (
                <div
                  key={league.tier}
                  className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all shadow-md ${
                    isCurrent
                      ? 'bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-400 text-white shadow-amber-500/15'
                      : isUnlocked
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-slate-50/70 border-slate-200 opacity-60 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-xs ${
                        isCurrent ? 'bg-amber-900/60 border-amber-400' : 'bg-slate-100 border-slate-200'
                      }`}>
                        {getTierIcon(league.tier)}
                      </div>
                      {isCurrent ? (
                        <span className="text-[11px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-3 py-1 rounded-full shadow-md">
                          لیگ فعلی شما
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> باز شده
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" /> قفل
                        </span>
                      )}
                    </div>

                    <h4 className={`text-base font-black ${isCurrent ? 'text-white' : 'text-slate-900'}`}>{league.tierFa}</h4>
                    <p className={`text-xs font-mono font-black mt-0.5 ${isCurrent ? 'text-amber-400' : 'text-amber-700'}`}>
                      {league.minTrophies.toLocaleString()} تا {league.maxTrophies === 99999 ? '∞' : league.maxTrophies.toLocaleString()} کاپ 🏆
                    </p>
                  </div>

                  {/* Season Rewards for Tier */}
                  <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    isCurrent ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <p className="font-black text-amber-500 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-amber-500" /> جایزه پایان فصل:
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">طلا و الماس:</span>
                      <span className="text-yellow-400 font-black font-mono">+{league.seasonReward.gold.toLocaleString()}🪙 • +{league.seasonReward.gems}💎</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">آیتم ویژه:</span>
                      <span className="text-cyan-400 font-extrabold">{league.seasonReward.rareItemNameFa}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: GLOBAL LEADERBOARD */}
      {activeView === 'leaderboard' && (
        <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              جدول رده‌بندی برترین مربیان و مبارزان جهان
            </h3>
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> همگام‌سازی زنده
            </span>
          </div>

          <div className="space-y-2.5">
            {GLOBAL_LEADERBOARD_PLAYERS.map((player) => {
              const isMe = player.id === 'p_5';

              return (
                <div
                  key={player.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all shadow-xs ${
                    isMe
                      ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-xs ${
                      player.rank === 1
                        ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : player.rank === 2
                        ? 'bg-slate-300 text-slate-900 border border-slate-400'
                        : player.rank === 3
                        ? 'bg-amber-800 text-amber-100'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      #{player.rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900">{player.name}</p>
                        {player.allianceTag && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-mono px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                            [{player.allianceTag}]
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black shadow-xs">
                            شما
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        هیولای برگزیده: {player.topMonsterName} • نرخ پیروزی: {player.winRate}٪
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm md:text-base font-black text-amber-800 font-mono">
                      {player.trophies.toLocaleString()} 🏆
                    </span>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">{player.league}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
