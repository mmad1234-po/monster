import React, { useState } from 'react';
import { Alliance, TeamQuest, ShopItem, Monster } from '../types';
import { ALLIANCE_SHOP_ITEMS, INITIAL_TEAM_QUESTS } from '../data/gameData';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Shield, 
  ShieldAlert, 
  Coins, 
  Gem, 
  Users, 
  Swords, 
  Award, 
  ShoppingBag, 
  Flame, 
  Zap, 
  Clock, 
  Trophy,
  Sparkles,
  CheckCircle2,
  Crown
} from 'lucide-react';

interface AllianceHubProps {
  alliance: Alliance;
  onUpdateAlliance: (updated: Alliance) => void;
  playerGold: number;
  playerGems: number;
  playerClanCoins: number;
  onSpendCurrency: (gold: number, gems: number, clanCoins?: number) => boolean;
  onAddRewards: (gold: number, gems: number, clanCoins?: number) => void;
  activeMonster: Monster;
}

export const AllianceHub: React.FC<AllianceHubProps> = ({
  alliance,
  onUpdateAlliance,
  playerGold,
  playerGems,
  playerClanCoins,
  onSpendCurrency,
  onAddRewards,
  activeMonster,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'war' | 'treasury' | 'shop' | 'raids' | 'leaderboard'>('overview');
  
  // Alliance War Attack Limits (2 attacks per war round)
  const [warAttacksRemaining, setWarAttacksRemaining] = useState<number>(() => {
    const saved = localStorage.getItem('monster_game_war_attacks_left');
    return saved !== null ? parseInt(saved, 10) : 2;
  });
  const [isAttackingWar, setIsAttackingWar] = useState(false);

  // Treasury donation states
  const [donateAmount, setDonateAmount] = useState(1000);
  const [donateType, setDonateType] = useState<'gold' | 'gems'>('gold');

  // Co-op Raids
  const [teamQuests, setTeamQuests] = useState<TeamQuest[]>(INITIAL_TEAM_QUESTS);
  const [attackingQuestId, setAttackingQuestId] = useState<string | null>(null);

  // Reset War Round (for testing or next war)
  const handleResetWarRound = () => {
    sounds.playClick();
    setWarAttacksRemaining(2);
    localStorage.setItem('monster_game_war_attacks_left', '2');
    alert('دور جدید جنگ اتحاد با ۲ فرصت حمله فعال شد!');
  };

  // Donate to Treasury
  const handleDonate = () => {
    if (donateType === 'gold') {
      if (playerGold < donateAmount) {
        alert('موجودی طلا کافی نیست!');
        return;
      }
      if (!onSpendCurrency(donateAmount, 0)) return;
      sounds.playCoin();

      const updated = {
        ...alliance,
        treasuryGold: alliance.treasuryGold + donateAmount,
        xp: alliance.xp + Math.floor(donateAmount / 10),
      };
      const earnedCoins = Math.floor(donateAmount / 10);
      onAddRewards(0, 0, earnedCoins);
      onUpdateAlliance(updated);
      alert(`با تشکر از اهدای شما! ${earnedCoins} سکه اتحاد به شما پاداش داده شد.`);
    } else {
      if (playerGems < donateAmount) {
        alert('موجودی الماس کافی نیست!');
        return;
      }
      if (!onSpendCurrency(0, donateAmount)) return;
      sounds.playCoin();

      const updated = {
        ...alliance,
        treasuryGems: alliance.treasuryGems + donateAmount,
        xp: alliance.xp + donateAmount * 5,
      };
      const earnedCoins = donateAmount * 15;
      onAddRewards(0, 0, earnedCoins);
      onUpdateAlliance(updated);
      alert(`با تشکر از اهدای الماس شما! ${earnedCoins} سکه اتحاد به شما پاداش داده شد.`);
    }
  };

  // Upgrade Guild Perk from Treasury
  const handleUpgradePerk = (perkId: string) => {
    const perk = alliance.perks.find((p) => p.id === perkId);
    if (!perk) return;
    if (perk.level >= perk.maxLevel) return;

    if (alliance.treasuryGold < perk.costGold || alliance.treasuryGems < perk.costGems) {
      alert('موجودی خزانه اتحاد برای ارتقای این مزیت کافی نیست! اعضا باید به خزانه اهدا کنند.');
      return;
    }

    sounds.playLevelUp();
    confetti({ particleCount: 80, spread: 60 });

    const updatedPerks = alliance.perks.map((p) => {
      if (p.id === perkId) {
        return {
          ...p,
          level: p.level + 1,
          bonusPercent: p.bonusPercent + 5,
          costGold: Math.floor(p.costGold * 1.5),
          costGems: Math.floor(p.costGems * 1.5),
        };
      }
      return p;
    });

    onUpdateAlliance({
      ...alliance,
      treasuryGold: alliance.treasuryGold - perk.costGold,
      treasuryGems: alliance.treasuryGems - perk.costGems,
      perks: updatedPerks,
    });
  };

  // Attack in Alliance War (Strictly limited to remaining attacks)
  const handleAttackWar = () => {
    if (!alliance.currentWar) return;
    if (warAttacksRemaining <= 0) {
      alert('⚠️ تمام فرصت‌های حمله شما در این نبرد استفاده شده است (۲ از ۲)! منتظر آغاز دور بعدی جنگ باشید.');
      return;
    }
    if (isAttackingWar) return;

    setIsAttackingWar(true);
    sounds.playHit('fire');
    confetti({ particleCount: 100, spread: 70 });

    const nextRemaining = warAttacksRemaining - 1;
    setWarAttacksRemaining(nextRemaining);
    localStorage.setItem('monster_game_war_attacks_left', nextRemaining.toString());

    const starsWon = 3;
    const warGold = 800;
    const warCoins = 150;

    const newLogs = [
      { attacker: `شما (حمله ${3 - nextRemaining} از ۲)`, stars: starsWon, timestamp: 'هم‌اکنون' },
      ...alliance.currentWar.logs,
    ];

    const updatedWar = {
      ...alliance.currentWar,
      ourStars: alliance.currentWar.ourStars + starsWon,
      logs: newLogs,
    };

    onAddRewards(warGold, 20, warCoins);
    onUpdateAlliance({
      ...alliance,
      trophies: alliance.trophies + 45,
      currentWar: updatedWar,
    });

    setTimeout(() => {
      setIsAttackingWar(false);
      alert(`🎉 پیروزی درخشان در جنگ اتحاد! کسب ۳ ستاره، ${warGold} طلا و ${warCoins} سکه اتحاد.\n(فرصت‌های حمله باقی‌مانده شما: ${nextRemaining} از ۲)`);
    }, 400);
  };

  // Buy Alliance Shop Item
  const handleBuyAllianceShop = (item: ShopItem) => {
    if (playerClanCoins < item.price) {
      alert('سکه‌های اتحاد شما کافی نیست! در جنگ اتحادها و ریدهای تیمی شرکت کنید.');
      return;
    }
    if (!onSpendCurrency(0, 0, item.price)) return;
    sounds.playCoin();
    confetti({ particleCount: 90, spread: 70 });
    alert(`خرید موفقیت‌آمیز [${item.nameFa}]!`);
  };

  // Attack Raid Boss in Co-op Quest
  const handleAttackRaidBoss = (quest: TeamQuest) => {
    setAttackingQuestId(quest.id);
    sounds.playUltimate();

    setTimeout(() => {
      const dmg = Math.floor(activeMonster.attack * 25 + Math.random() * 500);
      const updatedList = teamQuests.map((q) => {
        if (q.id === quest.id) {
          const newHp = Math.max(0, q.bossHp - dmg);
          const isFinished = newHp === 0;
          if (isFinished) {
            sounds.playVictory();
            confetti({ particleCount: 140, spread: 80 });
            onAddRewards(q.rewardGold, q.rewardGems, q.rewardClanCoins);
          }
          return {
            ...q,
            bossHp: newHp,
            completed: isFinished,
            participants: q.participants.map((p) => 
              p.name.includes('شما') ? { ...p, damage: p.damage + dmg } : p
            ),
          };
        }
        return q;
      });

      setTeamQuests(updatedList);
      setAttackingQuestId(null);
      if (quest.bossHp - dmg <= 0) {
        alert(`🏆 باس رید تیمی با موفقیت شکست خورد! پاداش بزرگ ${quest.rewardGold} طلا، ${quest.rewardGems} الماس و ${quest.rewardClanCoins} سکه اتحاد به تمام اعضای تیم اهدا شد!`);
      } else {
        alert(`⚔️ ضربه رید تیمی وارد شد! شما ${dmg} خسارت به باس وارد کردید.`);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Alliance Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 relative overflow-hidden shadow-xl text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center">
                <Flame className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl md:text-2xl font-black text-white">{alliance.name}</h2>
                <span className="text-xs bg-amber-500 text-slate-950 font-mono font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  [{alliance.tag}]
                </span>
                <span className="text-xs bg-slate-800 text-amber-300 border border-amber-400/40 font-black px-2.5 py-0.5 rounded-full">
                  سطح {alliance.level}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-300 mt-1 max-w-xl">{alliance.description}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-2xl shadow-md">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold">کاپ اتحاد</p>
              <p className="text-sm font-black text-amber-400">{alliance.trophies.toLocaleString()} 🏆</p>
            </div>
            <div className="h-7 w-[1px] bg-slate-700" />
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold">اعضای آنلاین</p>
              <p className="text-sm font-black text-emerald-400">
                {alliance.members.filter((m) => m.isOnline).length}/{alliance.members.length} 🟢
              </p>
            </div>
            <div className="h-7 w-[1px] bg-slate-700" />
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold">سکه‌های شما</p>
              <p className="text-sm font-black text-purple-400">{playerClanCoins.toLocaleString()} 🪙</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alliance Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'اطلاعات و اعضا', icon: Users },
          { id: 'war', label: 'جنگ اتحادها (Clan War)', icon: Swords, badge: 'فعال' },
          { id: 'treasury', label: 'خزانه و ارتقای مزایا', icon: Coins },
          { id: 'raids', label: 'ماموریت‌های چندنفره تیمی', icon: ShieldAlert, badge: '۲ آماده' },
          { id: 'shop', label: 'فروشگاه اختصاصی اتحاد', icon: ShoppingBag },
          { id: 'leaderboard', label: 'لیدربرد اتحادها', icon: Trophy },
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
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap shadow-xs ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200/90'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.2 rounded-full font-black shadow-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ALLIANCE OVERVIEW & MEMBERS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members List (2 cols) */}
          <div className="lg:col-span-2 bg-white/95 border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                فهرست اعضای فعال اتحاد ({alliance.members.length} نفر)
              </h3>
            </div>

            <div className="space-y-2.5">
              {alliance.members.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center font-black text-amber-800">
                        {member.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${member.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900">{member.name}</p>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900">
                          {member.roleFa}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">هیولای اصلی: {member.activeMonsterName} • اهدایی: {member.donations}🪙</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-amber-800">{member.trophies.toLocaleString()} 🏆</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alliance War Record & Stats (1 col) */}
          <div className="space-y-4">
            <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-md">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                کارنامه افتخارات جنگی
              </h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-800">پیروزی‌های جنگ</p>
                  <p className="text-xl font-black text-emerald-700 mt-1">{alliance.warWins} برد</p>
                </div>
                <div className="bg-rose-50 border border-rose-300 p-3 rounded-2xl">
                  <p className="text-xs font-bold text-rose-800">شکست‌ها</p>
                  <p className="text-xl font-black text-rose-700 mt-1">{alliance.warLosses} باخت</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                <p className="font-black text-amber-800">📜 مرام‌نامه و قوانین اتحاد:</p>
                <p>• شرکت در تمام جنگ‌های فصلی الزامی است.</p>
                <p>• حداقل اهدای هفتگی به خزانه: ۵۰۰ طلا.</p>
                <p>• هماهنگی در چت اتحاد قبل از اتک به قلعه‌های اصلی.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALLIANCE WARS (CLAN WAR) */}
      {activeTab === 'war' && alliance.currentWar && (
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 space-y-6 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-700 pb-4 relative z-10">
              <div>
                <span className="text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-400/40 px-3 py-1 rounded-full">
                  🔥 نبرد زنده فتح قلمرو کلن‌ها
                </span>
                <h3 className="text-xl font-black text-white mt-2">اتاق فرماندهی جنگ اتحاد</h3>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl text-xs font-black text-amber-400 shadow-md">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                زمان باقی‌مانده: {alliance.currentWar.endTimeMinutes} دقیقه
              </div>
            </div>

            {/* War Score Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-center relative z-10">
              {/* Our Alliance */}
              <div className="bg-slate-800/90 border border-amber-400/60 p-4 rounded-2xl shadow-md">
                <p className="text-xs font-black text-amber-400">اتحاد ما: [{alliance.tag}]</p>
                <p className="text-4xl font-black text-amber-400 mt-1">{alliance.currentWar.ourStars} ⭐</p>
                <p className="text-xs font-bold text-slate-400 mt-1">ستاره‌های کسب‌شده</p>
              </div>

              {/* Center VS */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <Swords className="w-7 h-7 text-rose-400" />
                </div>
                <p className="text-xs font-black text-slate-300 mt-2">نبرد رو در رو</p>
              </div>

              {/* Opponent Clan */}
              <div className="bg-slate-800/90 border border-rose-500/60 p-4 rounded-2xl shadow-md">
                <p className="text-xs font-black text-rose-400">حریف: {alliance.currentWar.opponentClan}</p>
                <p className="text-4xl font-black text-rose-400 mt-1">{alliance.currentWar.theirStars} ⭐</p>
                <p className="text-xs font-bold text-slate-400 mt-1">ستاره‌های حریف</p>
              </div>
            </div>

            {/* Attack Button & Quota */}
            <div className="text-center pt-2 space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-4 py-1.5 rounded-full text-xs">
                <span className="text-slate-400 font-bold">فرصت‌های مجاز حمله شما:</span>
                <span className={`font-black font-mono px-2 py-0.5 rounded-md ${
                  warAttacksRemaining > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {warAttacksRemaining} از ۲ حمله ⚔️
                </span>
              </div>

              <div>
                <button
                  onClick={handleAttackWar}
                  disabled={warAttacksRemaining <= 0 || isAttackingWar}
                  className={`px-8 py-3.5 font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto ${
                    warAttacksRemaining > 0 && !isAttackingWar
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-600/40 cursor-pointer'
                      : 'bg-slate-700 text-slate-400 border border-slate-600 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Swords className="w-5 h-5" />
                  {isAttackingWar
                    ? 'در حال انجام نبرد جنگی...'
                    : warAttacksRemaining > 0
                    ? `شروع حمله به قلعه حریف (+3 ستاره جنگی)`
                    : 'فرصت‌های حمله شما در این نبرد پایان یافته است (۰ از ۲)'}
                </button>
              </div>

              {warAttacksRemaining === 0 && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  <p className="text-xs text-slate-400 font-bold">تمام حملات شما ثبت شده است. جوایز پایان جنگ پس از پایان زمان نبرد محاسبه خواهد شد.</p>
                  <button
                    onClick={handleResetWarRound}
                    className="text-xs text-amber-400 underline hover:text-amber-300 font-bold"
                  >
                    شروع نوبت جدید جنگ
                  </button>
                </div>
              )}
            </div>

            {/* Battle Logs */}
            <div className="relative z-10">
              <h4 className="text-xs font-black text-slate-300 mb-2">گزارش حملات اخیر اعضای اتحاد:</h4>
              <div className="space-y-2">
                {alliance.currentWar.logs.map((log, i) => (
                  <div key={i} className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs shadow-xs">
                    <span className="font-bold text-white">{log.attacker}</span>
                    <span className="text-amber-400 font-black">کسب {log.stars} ستاره ⭐</span>
                    <span className="text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALLIANCE TREASURY & PERKS */}
      {activeTab === 'treasury' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Treasury Vault Card */}
            <div className="bg-white/95 border border-amber-300 rounded-3xl p-6 space-y-4 shadow-md">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                خزانه مرکزی اتحاد (Treasury Vault)
              </h3>
              <p className="text-xs font-bold text-slate-500">اعضای اتحاد می‌توانند برای ارتقای مزایای دائمی کل اعضا به این صندوق واریز کنند.</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
                  <p className="text-xs font-bold text-slate-600">طلای موجود در خزانه</p>
                  <p className="text-2xl font-black text-amber-800 mt-1">{alliance.treasuryGold.toLocaleString()} 🪙</p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-200 shadow-xs">
                  <p className="text-xs font-bold text-slate-600">الماس‌های خزانه</p>
                  <p className="text-2xl font-black text-cyan-800 mt-1">{alliance.treasuryGems.toLocaleString()} 💎</p>
                </div>
              </div>

              {/* Donation Form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <p className="text-xs font-black text-slate-800">اهدای کمک به خزانه اتحاد:</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDonateType('gold')}
                    className={`flex-1 py-1.5 text-xs font-black rounded-xl border transition-colors ${
                      donateType === 'gold' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    اهدای طلا
                  </button>
                  <button
                    onClick={() => setDonateType('gems')}
                    className={`flex-1 py-1.5 text-xs font-black rounded-xl border transition-colors ${
                      donateType === 'gems' ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    اهدای الماس
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(Math.max(50, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                  <button
                    onClick={handleDonate}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-transform active:scale-95 shadow-xs"
                  >
                    واریز به خزانه
                  </button>
                </div>
              </div>
            </div>

            {/* Guild Perks Upgrades */}
            <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-md">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                مزایای قابل ارتقا برای تمام اعضا
              </h3>

              <div className="space-y-3">
                {alliance.perks.map((perk) => (
                  <div
                    key={perk.id}
                    className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900">{perk.nameFa}</p>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 font-black">
                          سطح {perk.level}/{perk.maxLevel}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-1">{perk.descriptionFa}</p>
                      <p className="text-[11px] text-amber-800 mt-1 font-mono font-black">
                        هزینه ارتقا: {perk.costGold.toLocaleString()} طلا + {perk.costGems} الماس از خزانه
                      </p>
                    </div>

                    <button
                      onClick={() => handleUpgradePerk(perk.id)}
                      disabled={perk.level >= perk.maxLevel}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-xs"
                    >
                      {perk.level >= perk.maxLevel ? 'حداکثر' : 'ارتقای مزیت'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CO-OP TEAM QUESTS & RAIDS */}
      {activeTab === 'raids' && (
        <div className="space-y-6">
          <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-md">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              ماموریت‌های چندنفره و باس‌ریدهای تیمی
            </h3>
            <p className="text-xs font-bold text-slate-500">با همکاری هم‌تیمی‌های اتحاد خود، باس‌های غول‌آسا را به زانو درآورید و پاداش‌های حماسی دریافت کنید.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`bg-slate-50 border p-5 rounded-3xl space-y-4 flex flex-col justify-between shadow-xs ${
                    quest.completed ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-black text-slate-900">{quest.titleFa}</h4>
                      {quest.completed ? (
                        <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> شکست داده شد
                        </span>
                      ) : (
                        <span className="text-xs bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full font-black">
                          عنصر {quest.bossElement}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-500">{quest.descriptionFa}</p>

                    {/* Boss HP Bar */}
                    <div className="mt-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-xs font-black mb-1">
                        <span className="text-rose-700">سلامت باس: {quest.bossNameFa}</span>
                        <span className="text-slate-700 font-mono">{quest.bossHp} / {quest.bossMaxHp} HP</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-300"
                          style={{ width: `${(quest.bossHp / quest.bossMaxHp) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Participants Contribution */}
                    <div className="mt-3">
                      <p className="text-[11px] font-black text-slate-600 mb-1.5">مشارکت اعضای تیم:</p>
                      <div className="space-y-1">
                        {quest.participants.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-xl border border-slate-100">
                            <span className="text-slate-800 font-bold">{p.name}</span>
                            <span className="text-amber-800 font-mono font-black">{p.damage} خسارت</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rewards & Action */}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs font-black mb-3">
                      <span className="text-slate-500">پاداش تیمی:</span>
                      <span className="text-amber-800 font-mono font-black">+{quest.rewardGold} طلا • +{quest.rewardGems} الماس • +{quest.rewardClanCoins} سکه</span>
                    </div>

                    <button
                      onClick={() => handleAttackRaidBoss(quest)}
                      disabled={quest.completed || attackingQuestId === quest.id}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-600/20 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Swords className="w-4 h-4" />
                      {attackingQuestId === quest.id ? 'در حال حمله با هیولا...' : quest.completed ? 'ماموریت کامل شده' : 'حمله به باس رید تیمی'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ALLIANCE EXCLUSIVE SHOP */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  فروشگاه اختصاصی تجهیزات و عتیقه‌های اتحاد
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1">خرید با سکه‌های افتخار کسب‌شده در جنگ اتحادها و ماموریت‌های تیمی.</p>
              </div>
              <div className="bg-purple-100 text-purple-900 border border-purple-300 px-3.5 py-1.5 rounded-2xl text-xs font-black">
                موجودی شما: {playerClanCoins.toLocaleString()} سکه اتحاد
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ALLIANCE_SHOP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center mb-3">
                      <Award className="w-6 h-6 text-purple-700" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{item.nameFa}</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">{item.descriptionFa}</p>
                  </div>

                  <button
                    onClick={() => handleBuyAllianceShop(item)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    خرید با {item.price} سکه اتحاد
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ALLIANCE LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-md">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            جدول رده‌بندی برترین اتحادهای جهان
          </h3>

          <div className="space-y-2.5">
            {[
              { rank: 1, name: 'Phoenix Vanguard (اتحاد شما)', tag: 'PHNX', score: 18450, wins: 28, isMine: true },
              { rank: 2, name: 'Shadow Legion', tag: 'SHDW', score: 17920, wins: 26, isMine: false },
              { rank: 3, name: 'Thunder Gods', tag: 'THNDR', score: 16840, wins: 24, isMine: false },
              { rank: 4, name: 'Oceanic Titans', tag: 'OCEAN', score: 15400, wins: 21, isMine: false },
              { rank: 5, name: 'Solar Empire', tag: 'SOLAR', score: 14200, wins: 19, isMine: false },
            ].map((cl) => (
              <div
                key={cl.rank}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
                  cl.isMine ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                    cl.rank === 1 ? 'bg-amber-500 text-slate-950 shadow-xs' : cl.rank === 2 ? 'bg-slate-300 text-slate-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    #{cl.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900">{cl.name}</p>
                      <span className="text-xs text-amber-800 font-mono font-black">[{cl.tag}]</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500">{cl.wins} پیروزی جنگی</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-amber-800 font-mono">{cl.score.toLocaleString()} 🏆</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
