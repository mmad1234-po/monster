import React, { useState, useEffect } from 'react';
import { 
  Monster, 
  Alliance, 
  TrainerCustomization, 
  ShopItem 
} from './types';
import { 
  INITIAL_MONSTERS, 
  INITIAL_ALLIANCE 
} from './data/gameData';
import { MonsterNursery } from './components/MonsterNursery';
import { BattleArena } from './components/BattleArena';
import { AllianceHub } from './components/AllianceHub';
import { SeasonalLeagues } from './components/SeasonalLeagues';
import { GameShop } from './components/GameShop';
import { SocialChatVoice } from './components/SocialChatVoice';
import { ErrorBoundary } from './components/ErrorBoundary';
import { sounds } from './utils/audio';
import { 
  Swords, 
  Dna, 
  Shield, 
  Trophy, 
  ShoppingBag, 
  MessageSquare, 
  Coins, 
  Gem, 
  Volume2, 
  VolumeX, 
  Flame, 
  Zap, 
  User, 
  Award,
  Crown
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'nursery' | 'battle' | 'alliance' | 'leagues' | 'shop' | 'social'>('nursery');

  // Audio Toggle
  const [soundOn, setSoundOn] = useState(true);

  // Player State (with Safe LocalStorage parsing and fallback)
  const [monsters, setMonsters] = useState<Monster[]>(() => {
    try {
      const saved = localStorage.getItem('monster_game_monsters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load monsters from local storage, using initial data:', e);
    }
    return INITIAL_MONSTERS;
  });

  const [activeMonsterId, setActiveMonsterId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('monster_game_active_id');
      if (saved) return saved;
    } catch {}
    return INITIAL_MONSTERS[0]?.id || 'mon_1';
  });

  const [playerGold, setPlayerGold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('monster_game_gold');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num)) return num;
      }
    } catch {}
    return 3200;
  });

  const [playerGems, setPlayerGems] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('monster_game_gems');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num)) return num;
      }
    } catch {}
    return 480;
  });

  const [playerClanCoins, setPlayerClanCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('monster_game_clan_coins');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num)) return num;
      }
    } catch {}
    return 650;
  });

  const [playerTrophies, setPlayerTrophies] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('monster_game_trophies');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num)) return num;
      }
    } catch {}
    return 2150;
  });

  const [alliance, setAlliance] = useState<Alliance>(() => {
    try {
      const saved = localStorage.getItem('monster_game_alliance');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          return {
            ...INITIAL_ALLIANCE,
            ...parsed,
            members: Array.isArray(parsed.members) ? parsed.members : INITIAL_ALLIANCE.members,
            perks: Array.isArray(parsed.perks) ? parsed.perks : INITIAL_ALLIANCE.perks,
            currentWar: parsed.currentWar || INITIAL_ALLIANCE.currentWar,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load alliance from storage, using default:', e);
    }
    return INITIAL_ALLIANCE;
  });

  const [trainer, setTrainer] = useState<TrainerCustomization>(() => {
    try {
      const saved = localStorage.getItem('monster_game_trainer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.name) {
          return parsed;
        }
      }
    } catch {}
    return {
      name: 'آریا فرمانده',
      avatarId: 'avatar_shadow_hunter',
      title: 'Grand Beastmaster',
      titleFa: 'استاد پرورش هیولاها',
      badge: 'Gold',
      frameColor: '#f59e0b',
    };
  });

  // Save to LocalStorage on changes with error protection
  useEffect(() => {
    try {
      localStorage.setItem('monster_game_monsters', JSON.stringify(monsters));
    } catch (e) {
      console.warn('Storage quota exceeded or restricted:', e);
    }
  }, [monsters]);

  useEffect(() => {
    try {
      localStorage.setItem('monster_game_active_id', activeMonsterId);
    } catch {}
  }, [activeMonsterId]);

  useEffect(() => {
    try {
      localStorage.setItem('monster_game_gold', playerGold.toString());
    } catch {}
  }, [playerGold]);

  useEffect(() => {
    try {
      localStorage.setItem('monster_game_gems', playerGems.toString());
    } catch {}
  }, [playerGems]);

  useEffect(() => {
    try {
      localStorage.setItem('monster_game_clan_coins', playerClanCoins.toString());
    } catch {}
  }, [playerClanCoins]);

  useEffect(() => {
    try {
      localStorage.setItem('monster_game_trophies', playerTrophies.toString());
    } catch {}
  }, [playerTrophies]);

  useEffect(() => {
    try {
      localStorage.setItem('monster_game_alliance', JSON.stringify(alliance));
    } catch {}
  }, [alliance]);

  useEffect(() => {
    try {
      localStorage.setItem('monster_game_trainer', JSON.stringify(trainer));
    } catch {}
  }, [trainer]);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sounds.setSoundEnabled(next);
    if (next) sounds.playClick();
  };

  // Currency handler
  const handleSpendCurrency = (gold: number, gems: number, clanCoins: number = 0): boolean => {
    if (playerGold < gold || playerGems < gems || playerClanCoins < clanCoins) {
      return false;
    }
    setPlayerGold((g) => g - gold);
    setPlayerGems((gem) => gem - gems);
    setPlayerClanCoins((c) => c - clanCoins);
    return true;
  };

  // Add Rewards
  const handleAddRewards = (gold: number, gems: number, clanCoins: number = 0) => {
    setPlayerGold((g) => g + gold);
    setPlayerGems((gem) => gem + gems);
    setPlayerClanCoins((c) => c + clanCoins);
  };

  // Update monster
  const handleUpdateMonster = (updated: Monster) => {
    setMonsters((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  // Add new monster
  const handleAddNewMonster = (newMonster: Monster) => {
    setMonsters((prev) => [newMonster, ...prev]);
    setActiveMonsterId(newMonster.id);
  };

  // Battle end callback
  const handleBattleEnd = (result: 'win' | 'loss', trophiesChange: number, goldGained: number, xpGained: number) => {
    setPlayerTrophies((t) => Math.max(0, t + trophiesChange));
    setPlayerGold((g) => g + goldGained);

    // Give XP to active monster
    setMonsters((prev) =>
      prev.map((m) => {
        if (m.id === activeMonsterId) {
          const newXp = m.xp + xpGained;
          let level = m.level;
          let maxXp = m.maxXp;
          let tp = m.trainingPoints;
          let atk = m.attack;
          let def = m.defense;
          let hp = m.maxHp;

          if (newXp >= maxXp) {
            level += 1;
            maxXp = Math.floor(maxXp * 1.35);
            tp += 2;
            atk += 5;
            def += 4;
            hp += 30;
          }
          return {
            ...m,
            xp: newXp >= maxXp ? newXp - maxXp : newXp,
            level,
            maxXp,
            trainingPoints: tp,
            attack: atk,
            defense: def,
            maxHp: hp,
            hp: hp,
          };
        }
        return m;
      })
    );
  };

  // Apply Shop Effect
  const handleApplyShopEffect = (effect: ShopItem['effect']) => {
    if (effect.type === 'xp') {
      setMonsters((prev) =>
        prev.map((m) => {
          if (m.id === activeMonsterId) {
            return { ...m, xp: m.xp + (effect.value || 300) };
          }
          return m;
        })
      );
    } else if (effect.type === 'stat_boost') {
      setMonsters((prev) =>
        prev.map((m) => {
          if (m.id === activeMonsterId) {
            return { ...m, trainingPoints: m.trainingPoints + (effect.value || 2) };
          }
          return m;
        })
      );
    }
  };

  const activeMonster = monsters.find((m) => m.id === activeMonsterId) || monsters[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/70 via-slate-50 to-sky-50/60 text-slate-800 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      
      {/* TOP STATUS HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/70 px-4 md:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Game Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-0.5 shadow-md shadow-amber-500/25">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-600 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                  دنیای هیولاها
                </h1>
                <span className="text-[10px] text-amber-900 font-extrabold px-2 py-0.5 bg-amber-100/90 rounded-full border border-amber-300">
                  MONSTER REALM
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 hidden sm:block">عرصه نبردهای استراتژیک، پرورش هیولا و جنگ اتحادها</p>
            </div>
          </div>

          {/* Player Wallet & Stats */}
          <div className="flex items-center gap-2 md:gap-2.5">
            {/* Trophies */}
            <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 rounded-2xl text-xs font-black text-amber-900 shadow-xs">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span className="font-mono">{playerTrophies.toLocaleString()}</span>
              <span className="text-[10px] text-amber-700/70 font-sans hidden sm:inline">کاپ</span>
            </div>

            {/* Gold */}
            <div className="flex items-center gap-1.5 bg-yellow-50/90 border border-yellow-200/80 px-3 py-1.5 rounded-2xl text-xs font-black text-yellow-900 shadow-xs">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="font-mono">{playerGold.toLocaleString()}</span>
              <span className="text-[10px] text-yellow-700/70 font-sans hidden sm:inline">طلا</span>
            </div>

            {/* Gems */}
            <div className="flex items-center gap-1.5 bg-cyan-50/90 border border-cyan-200/80 px-3 py-1.5 rounded-2xl text-xs font-black text-cyan-900 shadow-xs">
              <Gem className="w-4 h-4 text-cyan-600" />
              <span className="font-mono">{playerGems.toLocaleString()}</span>
              <span className="text-[10px] text-cyan-700/70 font-sans hidden sm:inline">الماس</span>
            </div>

            {/* Clan Coins */}
            <div className="hidden lg:flex items-center gap-1.5 bg-purple-50/90 border border-purple-200/80 px-3 py-1.5 rounded-2xl text-xs font-black text-purple-900 shadow-xs">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="font-mono">{playerClanCoins.toLocaleString()}</span>
              <span className="text-[10px] text-purple-700/70 font-sans">کلن</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
              title="تغییر وضعیت صدا"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN NAVIGATION BAR */}
      <nav className="bg-white/85 border-b border-slate-200/90 px-4 md:px-8 py-2 sticky top-[57px] z-30 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto pb-1">
          {[
            { id: 'nursery', label: 'پرورش و شخصی‌سازی', icon: Dna },
            { id: 'battle', label: 'میدان نبرد آنلاین', icon: Swords, highlight: true },
            { id: 'alliance', label: 'اتحاد و جنگ کلن‌ها', icon: Shield, badge: 'فعال' },
            { id: 'leagues', label: 'لیگ‌های فصلی و رده‌بندی', icon: Trophy },
            { id: 'shop', label: 'فروشگاه و تخم‌ها', icon: ShoppingBag },
            { id: 'social', label: 'چت صوتی و جوایز', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-black flex items-center gap-2 transition-all whitespace-nowrap shadow-xs ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50 scale-[1.02]'
                    : tab.highlight
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm hover:brightness-105 hover:shadow-rose-600/20'
                    : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200/90'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && (
                  <span className="text-[10px] bg-rose-600 text-white px-2 py-0.2 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN BODY CONTENT ROUTER */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 flex-1">
        {activeTab === 'nursery' && (
          <ErrorBoundary componentName="تالار پرورش و استودیوی هیولاها">
            <MonsterNursery
              monsters={monsters}
              activeMonsterId={activeMonsterId}
              onSelectActiveMonster={setActiveMonsterId}
              onUpdateMonster={handleUpdateMonster}
              playerGold={playerGold}
              playerGems={playerGems}
              onSpendCurrency={handleSpendCurrency}
              trainer={trainer}
              onUpdateTrainer={setTrainer}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'battle' && (
          <ErrorBoundary 
            componentName="میدان نبرد آنلاین (آرنا)"
            onReset={() => setActiveTab('nursery')}
          >
            <BattleArena
              playerMonster={activeMonster || monsters[0] || INITIAL_MONSTERS[0]}
              playerTrophies={playerTrophies}
              onBattleEnd={handleBattleEnd}
              onExit={() => setActiveTab('nursery')}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'alliance' && (
          <ErrorBoundary 
            componentName="مرکز اتحاد و فرماندهی کلن‌ها"
            onReset={() => setActiveTab('nursery')}
          >
            <AllianceHub
              alliance={alliance}
              onUpdateAlliance={setAlliance}
              playerGold={playerGold}
              playerGems={playerGems}
              playerClanCoins={playerClanCoins}
              onSpendCurrency={handleSpendCurrency}
              onAddRewards={handleAddRewards}
              activeMonster={activeMonster || monsters[0] || INITIAL_MONSTERS[0]}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'leagues' && (
          <ErrorBoundary componentName="لیگ‌های فصلی و رتبه‌بندی">
            <SeasonalLeagues playerTrophies={playerTrophies} />
          </ErrorBoundary>
        )}

        {activeTab === 'shop' && (
          <ErrorBoundary componentName="فروشگاه آیتم‌ها و تخم‌های باستانی">
            <GameShop
              playerGold={playerGold}
              playerGems={playerGems}
              onSpendCurrency={handleSpendCurrency}
              onAddNewMonster={handleAddNewMonster}
              onApplyShopEffect={handleApplyShopEffect}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'social' && (
          <ErrorBoundary componentName="سیستم گفتگوی صوتی و جوایز">
            <SocialChatVoice
              playerGold={playerGold}
              playerGems={playerGems}
              onAddRewards={handleAddRewards}
              activeMonster={activeMonster || monsters[0] || INITIAL_MONSTERS[0]}
              trainer={trainer}
              playerTrophies={playerTrophies}
            />
          </ErrorBoundary>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white/70 py-4 px-6 text-center text-xs text-slate-500">
        <p>Monster Realm: Arena of Alliances • دنیای هیولاها و اتحادهای کهن با هوش مصنوعی و ارتباط زنده</p>
      </footer>
    </div>
  );
}
