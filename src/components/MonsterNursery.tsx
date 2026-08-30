import React, { useState } from 'react';
import { Monster, MonsterSkill, TrainerCustomization } from '../types';
import { MonsterRenderer } from './MonsterRenderer';
import { ELEMENT_ADVANTAGES, MONSTER_ART_ASSETS } from '../data/gameData';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Dna, 
  Sparkles, 
  Zap, 
  Shield, 
  Sword, 
  Heart, 
  TrendingUp, 
  Palette, 
  User, 
  BookOpen, 
  Check, 
  ChevronRight, 
  Award,
  Crown,
  Scroll,
  RefreshCw,
  Eye,
  Layers,
  Flame
} from 'lucide-react';

interface MonsterNurseryProps {
  monsters: Monster[];
  activeMonsterId: string;
  onSelectActiveMonster: (id: string) => void;
  onUpdateMonster: (updated: Monster) => void;
  playerGold: number;
  playerGems: number;
  onSpendCurrency: (gold: number, gems: number) => boolean;
  trainer: TrainerCustomization;
  onUpdateTrainer: (updated: TrainerCustomization) => void;
}

export const MonsterNursery: React.FC<MonsterNurseryProps> = ({
  monsters,
  activeMonsterId,
  onSelectActiveMonster,
  onUpdateMonster,
  playerGold,
  playerGems,
  onSpendCurrency,
  trainer,
  onUpdateTrainer,
}) => {
  const [currentTab, setCurrentTab] = useState<'training' | 'skills' | 'evolution' | 'lore' | 'cosmetics' | 'trainer'>('training');
  const [isGeneratingLore, setIsGeneratingLore] = useState(false);
  const [loreNotification, setLoreNotification] = useState('');
  
  const currentMonster = monsters.find((m) => m.id === activeMonsterId) || monsters[0];

  // Train a specific stat
  const handleTrainStat = (stat: 'attack' | 'defense' | 'speed' | 'hp') => {
    if (currentMonster.trainingPoints <= 0) {
      if (playerGold < 150) {
        alert('برای خرید امتیاز آموزش به ۱۵۰ سکه طلا نیاز دارید یا در نبردهای آرنا پیروز شوید!');
        return;
      }
      if (!onSpendCurrency(150, 0)) return;
    }

    sounds.playCoin();
    const updated = { ...currentMonster };
    if (currentMonster.trainingPoints > 0) {
      updated.trainingPoints -= 1;
    }

    if (stat === 'attack') {
      updated.attack += 4;
      updated.affinityTrained.attack += 1;
    } else if (stat === 'defense') {
      updated.defense += 4;
      updated.affinityTrained.defense += 1;
    } else if (stat === 'speed') {
      updated.speed += 3;
      updated.affinityTrained.speed += 1;
    } else if (stat === 'hp') {
      updated.maxHp += 25;
      updated.hp = updated.maxHp;
      updated.affinityTrained.hp += 25;
    }

    onUpdateMonster(updated);
  };

  // Feed Monster for XP
  const handleFeedXp = (amount: number, goldCost: number) => {
    if (playerGold < goldCost) {
      alert('طلای کافی برای تهیه خوراک مغذی ندارید!');
      return;
    }
    if (!onSpendCurrency(goldCost, 0)) return;

    sounds.playCoin();
    const updated = { ...currentMonster };
    updated.xp += amount;

    // Check level up
    if (updated.xp >= updated.maxXp) {
      updated.xp -= updated.maxXp;
      updated.level += 1;
      updated.maxXp = Math.floor(updated.maxXp * 1.35);
      updated.trainingPoints += 2;
      updated.attack += 5;
      updated.defense += 4;
      updated.maxHp += 30;
      updated.hp = updated.maxHp;
      sounds.playLevelUp();
      confetti({ particleCount: 80, spread: 60 });
    }

    onUpdateMonster(updated);
  };

  // Evolve Monster
  const handleEvolve = () => {
    if (currentMonster.evolutionStage >= currentMonster.maxEvolutionStage) return;
    const requiredLevel = currentMonster.evolutionStage === 1 ? 5 : 8;
    const costGold = currentMonster.evolutionStage === 1 ? 1500 : 3500;
    const costGems = currentMonster.evolutionStage === 1 ? 50 : 150;

    if (currentMonster.level < requiredLevel) {
      alert(`برای دگرگونی به مرحله بعد هیولا باید حداقل به سطح ${requiredLevel} برسد!`);
      return;
    }

    if (playerGold < costGold || playerGems < costGems) {
      alert(`برای تکامل به ${costGold} طلا و ${costGems} الماس نیاز دارید!`);
      return;
    }

    if (!onSpendCurrency(costGold, costGems)) return;

    sounds.playUltimate();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });

    const updated = { ...currentMonster };
    updated.evolutionStage += 1;
    updated.attack += 15;
    updated.defense += 15;
    updated.maxHp += 80;
    updated.hp = updated.maxHp;
    updated.trainingPoints += 4;

    onUpdateMonster(updated);
  };

  // Upgrade Skill
  const handleUpgradeSkill = (skill: MonsterSkill) => {
    if (skill.upgradeLevel >= skill.maxUpgradeLevel) return;
    const costGold = skill.upgradeLevel * 300;
    if (playerGold < costGold) {
      alert(`برای ارتقای این مهارت به ${costGold} طلا نیاز دارید!`);
      return;
    }
    if (!onSpendCurrency(costGold, 0)) return;

    sounds.playLevelUp();
    const updated = { ...currentMonster };
    const target = updated.skills.find((s) => s.id === skill.id);
    if (target) {
      target.upgradeLevel += 1;
      target.power += 12;
      if (target.upgradeLevel % 2 === 0 && target.energyCost > 15) {
        target.energyCost -= 5;
      }
    }
    onUpdateMonster(updated);
  };

  // Update Cosmetic Option
  const handleUpdateCosmetic = (key: keyof Monster['cosmetics'], value: string) => {
    sounds.playClick();
    const updated = {
      ...currentMonster,
      cosmetics: {
        ...currentMonster.cosmetics,
        [key]: value,
      },
    };
    onUpdateMonster(updated);
  };

  // Generate / Chronicler with Gemini AI
  const handleGenerateAiLore = async () => {
    setIsGeneratingLore(true);
    sounds.playClick();
    try {
      const res = await fetch('/api/gemini/monster-lore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameFa: currentMonster.nameFa,
          element: currentMonster.element,
          level: currentMonster.level,
          evolutionStage: currentMonster.evolutionStage,
          speciesFa: currentMonster.speciesFa,
        }),
      });
      const data = await res.json();
      
      const updated: Monster = {
        ...currentMonster,
        loreTitleFa: data.loreTitleFa || currentMonster.loreTitleFa,
        loreBackstoryFa: data.loreBackstoryFa || currentMonster.loreBackstoryFa,
        loreSummonChantFa: data.loreSummonChantFa || currentMonster.loreSummonChantFa,
        loreHiddenTraitFa: data.loreHiddenTraitFa || currentMonster.loreHiddenTraitFa,
      };

      onUpdateMonster(updated);
      sounds.playRadioPing();
      setLoreNotification('کتیبه اساطیری هیولا توسط هوش مصنوعی با موفقیت ثبت شد! ✨');
      setTimeout(() => setLoreNotification(''), 4000);
    } catch (e) {
      console.error(e);
      setLoreNotification('خطا در اتصال به سرور هوش مصنوعی.');
      setTimeout(() => setLoreNotification(''), 3000);
    } finally {
      setIsGeneratingLore(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Monster Selection Bar */}
      <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-4 md:p-5 shadow-md">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
            <Dna className="w-5 h-5 text-amber-600" />
            انتخاب و مدیریت هیولاهای شما ({monsters.length} هیولای فعال)
          </h2>
          <span className="text-xs font-extrabold text-slate-500 hidden sm:inline">هیولای برگزیده برای نبردهای آرنا و اتحاد</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {monsters.map((mon) => {
            const isSelected = mon.id === currentMonster.id;
            return (
              <button
                key={mon.id}
                onClick={() => {
                  sounds.playClick();
                  onSelectActiveMonster(mon.id);
                }}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col items-center justify-between shadow-xs ${
                  isSelected
                    ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40 scale-[1.02]'
                    : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-xs mb-2 overflow-hidden">
                  <MonsterRenderer monster={mon} size="sm" />
                </div>
                <div className="w-full text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs font-black text-slate-900 truncate">{mon.nameFa}</p>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] font-extrabold text-slate-500 mt-0.5">سطح {mon.level} • مرحله {mon.evolutionStage}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Nursery Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Monster Showcase & Visuals (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-white via-amber-50/30 to-sky-50/30 border border-slate-200/90 rounded-3xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-md">
          
          {/* Header Info */}
          <div className="w-full flex items-center justify-between z-10">
            <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-xs ${ELEMENT_ADVANTAGES[currentMonster.element]?.bg}`}>
              عنصر {ELEMENT_ADVANTAGES[currentMonster.element]?.labelFa}
            </span>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-amber-200 text-xs font-black text-amber-800 shadow-xs">
              <Crown className="w-3.5 h-3.5 text-amber-600" /> سطح {currentMonster.level}
            </div>
          </div>

          {/* Central Monster Display */}
          <div className="my-5 relative py-2">
            <MonsterRenderer monster={currentMonster} size="xl" />
          </div>

          {/* Monster Name & Species */}
          <div className="z-10 w-full">
            <h3 className="text-2xl font-black text-slate-900 tracking-wide">{currentMonster.nameFa}</h3>
            <p className="text-xs font-bold text-slate-600 mt-1">
              {currentMonster.speciesFa} • مرحله تکامل {currentMonster.evolutionStage} از {currentMonster.maxEvolutionStage}
            </p>

            {currentMonster.loreTitleFa && (
              <p className="text-xs font-black text-amber-800 bg-amber-100/80 border border-amber-300 px-3.5 py-1 rounded-full inline-block mt-2 shadow-xs">
                ✨ «{currentMonster.loreTitleFa}»
              </p>
            )}

            {/* XP Progress Bar */}
            <div className="mt-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-black mb-1.5">
                <span className="text-cyan-700 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-cyan-600" /> تجربه تا ارتقای سطح</span>
                <span className="text-slate-700 font-mono">{currentMonster.xp} / {currentMonster.maxXp} XP</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (currentMonster.xp / currentMonster.maxXp) * 100)}%` }}
                />
              </div>

              {/* Feed Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => handleFeedXp(120, 100)}
                  className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  🍇 خوراک (+120 XP) <span className="text-amber-800 text-[10px]">100🪙</span>
                </button>
                <button
                  onClick={() => handleFeedXp(350, 250)}
                  className="py-2 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-black rounded-xl border border-cyan-300 transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  ⚡ معجون (+350 XP) <span className="text-amber-800 text-[10px]">250🪙</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tabbed Management Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between shadow-md">
          
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 mb-5">
            {[
              { id: 'training', label: 'تمرین ویژگی‌ها', icon: TrendingUp },
              { id: 'skills', label: 'درخت مهارت‌ها', icon: BookOpen },
              { id: 'evolution', label: 'دگرگونی و تکامل', icon: Sparkles },
              { id: 'lore', label: 'کتیبه هوش مصنوعی', icon: Scroll },
              { id: 'cosmetics', label: 'شخصی‌سازی ظاهر', icon: Palette },
              { id: 'trainer', label: 'مربی و کاراکتر', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playClick();
                    setCurrentTab(tab.id as any);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: STATS TRAINING */}
          {currentTab === 'training' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs font-black">
                <span className="text-amber-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> امتیاز آموزش در دسترس: {currentMonster.trainingPoints}
                </span>
                <span className="text-slate-600 font-bold">یا خرید هر امتیاز با ۱۵۰ سکه طلا</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Attack Stat Card */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center">
                      <Sword className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">قدرت حمله</p>
                      <p className="text-base font-black text-slate-900">{currentMonster.attack}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTrainStat('attack')}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-transform active:scale-95 shadow-xs"
                  >
                    +۴ ارتقا
                  </button>
                </div>

                {/* Defense Stat Card */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">دفاع و زره</p>
                      <p className="text-base font-black text-slate-900">{currentMonster.defense}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTrainStat('defense')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-transform active:scale-95 shadow-xs"
                  >
                    +۴ ارتقا
                  </button>
                </div>

                {/* Speed Stat Card */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">سرعت چابکی</p>
                      <p className="text-base font-black text-slate-900">{currentMonster.speed}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTrainStat('speed')}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-transform active:scale-95 shadow-xs"
                  >
                    +۳ ارتقا
                  </button>
                </div>

                {/* HP Stat Card */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">حداکثر سلامت</p>
                      <p className="text-base font-black text-slate-900">{currentMonster.maxHp}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTrainStat('hp')}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-transform active:scale-95 shadow-xs"
                  >
                    +۲۵ سلامت
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SKILL TREE & UPGRADE */}
          {currentTab === 'skills' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500">مهارت‌های رزمی فعال هیولا. ارتقای هر سطح موجب افزایش قدرت تخریب و بهینه‌سازی مصرف انرژی می‌شود.</p>
              <div className="space-y-2.5">
                {currentMonster.skills.map((skill) => (
                  <div 
                    key={skill.id}
                    className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900">{skill.nameFa}</p>
                          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                            سطح {skill.upgradeLevel}/{skill.maxUpgradeLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-bold mt-0.5">{skill.descriptionFa}</p>
                        <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 mt-1 font-mono">
                          <span className="text-emerald-700">قدرت: {skill.power}</span>
                          <span className="text-cyan-700">انرژی: {skill.energyCost}⚡</span>
                          <span className="text-amber-700">کول‌داون: {skill.cooldown} نوبت</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpgradeSkill(skill)}
                      disabled={skill.upgradeLevel >= skill.maxUpgradeLevel}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-xs"
                    >
                      {skill.upgradeLevel >= skill.maxUpgradeLevel ? 'حداکثر' : `ارتقا (${skill.upgradeLevel * 300}🪙)`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVOLUTION CHAMBER */}
          {currentTab === 'evolution' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-100 via-indigo-50 to-pink-50 border border-purple-200 p-5 rounded-2xl text-center">
                <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2 animate-spin" style={{ animationDuration: '8s' }} />
                <h4 className="text-lg font-black text-purple-950">محفظه دگرگونی و تکامل باستانی</h4>
                <p className="text-xs font-bold text-purple-800 mt-1">تکامل هیولا شکل ظاهری، شاخ‌ها، درخشش چشم‌ها، هاله‌های نوری و آمارهای رزمی را به طرز چشمگیری ارتقا می‌دهد!</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">مرحله تکامل فعلی:</span>
                  <span className="text-amber-800 font-black">مرحله {currentMonster.evolutionStage} از {currentMonster.maxEvolutionStage}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">سطح مورد نیاز:</span>
                  <span className="text-cyan-800 font-black">سطح {currentMonster.evolutionStage === 1 ? 5 : 8} (سطح شما: {currentMonster.level})</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">هزینه تکامل:</span>
                  <span className="text-amber-800 font-black">
                    {currentMonster.evolutionStage === 1 ? '1,500 طلا + 50 الماس' : '3,500 طلا + 150 الماس'}
                  </span>
                </div>

                <button
                  onClick={handleEvolve}
                  disabled={currentMonster.evolutionStage >= currentMonster.maxEvolutionStage}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-purple-600/25 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {currentMonster.evolutionStage >= currentMonster.maxEvolutionStage ? 'تکامل به حداکثر رسیده است' : '⚡ اجرای تکامل جادویی هیولا'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AI MYTHOLOGICAL LORE CHRONICLER */}
          {currentTab === 'lore' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Scroll className="w-4 h-4 text-amber-600" />
                    کتیبه و تاریخچه اساطیری هیولا
                  </h4>
                  <p className="text-xs text-slate-500">ثبت هوشمند هویت افسانه‌ای، وردهای احضار و خصلت‌های پنهان با هوش مصنوعی</p>
                </div>
                <button
                  onClick={handleGenerateAiLore}
                  disabled={isGeneratingLore}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-xs hover:brightness-110 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingLore ? 'animate-spin' : ''}`} />
                  {isGeneratingLore ? 'در حال ثبت...' : 'بازنویسی با هوش مصنوعی'}
                </button>
              </div>

              {loreNotification && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl text-center">
                  {loreNotification}
                </div>
              )}

              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
                  <span className="text-[11px] font-black text-amber-800 block mb-1">عنوان اساطیری:</span>
                  <p className="text-sm font-black text-slate-900">{currentMonster.loreTitleFa || 'نگهبان افسانه‌ای عناصر'}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
                  <span className="text-[11px] font-black text-amber-800 block mb-1">داستان پیشینه و منشأ:</span>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">{currentMonster.loreBackstoryFa || 'این هیولا در دوران پیدایش عناصر از قلب طبیعت بیدار شده و دارای قدرتی بی‌پایان است.'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                    <span className="text-[11px] font-black text-purple-700 block mb-1">ورد احضار جادویی:</span>
                    <p className="text-xs font-bold text-slate-800 italic">«{currentMonster.loreSummonChantFa || 'ای نیروی باستانی، در عرصه نبرد آشکار شو!'}»</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                    <span className="text-[11px] font-black text-emerald-700 block mb-1">خصلت ذاتی پنهان:</span>
                    <p className="text-xs font-bold text-slate-800">{currentMonster.loreHiddenTraitFa || 'افزایش ۱۰ درصدی قدرت در نبردهای حساس'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MONSTER COSMETICS & VISUAL STUDIO */}
          {currentTab === 'cosmetics' && (
            <div className="space-y-5">
              <div className="bg-amber-50/80 border border-amber-300/80 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-amber-950">استودیوی شخصی‌سازی ظاهر و شمایل هیولا</h4>
                  <p className="text-[11px] text-amber-800 font-bold mt-0.5">سبک بصری، گونه هنری، تاج‌ها، هاله‌های درخشان و رنگ‌های عنصر را به دلخواه خود تغییر دهید.</p>
                </div>
                <button
                  onClick={() => {
                    sounds.playHit(currentMonster.element);
                    confetti({ particleCount: 50, spread: 60 });
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  غرش هیولا
                </button>
              </div>

              {/* Beast Archetype & Concept Art Selection */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-2">انتخاب فرم هنری و شمایل هیولا:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'fire', nameFa: 'اژدهای آتشین گدازه', img: MONSTER_ART_ASSETS.fire, color: 'text-red-700 border-red-300' },
                    { id: 'water', nameFa: 'لویاتان یخی قطب', img: MONSTER_ART_ASSETS.water, color: 'text-cyan-700 border-cyan-300' },
                    { id: 'thunder', nameFa: 'شاهین رعدآسای صاعقه', img: MONSTER_ART_ASSETS.thunder, color: 'text-amber-700 border-amber-300' },
                    { id: 'void', nameFa: 'اژدهای کیهانی خلاء', img: MONSTER_ART_ASSETS.void, color: 'text-purple-700 border-purple-300' },
                    { id: 'light', nameFa: 'ققنوس خورشیدی نور', img: MONSTER_ART_ASSETS.light, color: 'text-yellow-700 border-yellow-300' },
                    { id: 'earth', nameFa: 'تایتان صخره‌ای زمرد', img: MONSTER_ART_ASSETS.earth, color: 'text-emerald-700 border-emerald-300' },
                  ].map((archetype) => (
                    <button
                      key={archetype.id}
                      onClick={() => {
                        sounds.playClick();
                        const updated = {
                          ...currentMonster,
                          imageUrl: archetype.img,
                        };
                        onUpdateMonster(updated);
                      }}
                      className={`p-2 rounded-2xl border text-right flex items-center gap-2.5 transition-all shadow-xs ${
                        currentMonster.imageUrl === archetype.img
                          ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img 
                        src={archetype.img} 
                        alt={archetype.nameFa}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200" 
                      />
                      <div className="truncate">
                        <p className="text-xs font-black text-slate-900 truncate">{archetype.nameFa}</p>
                        <span className="text-[10px] text-slate-500 font-bold">فرم حماسی</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Presentation Visual Style */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-2">سبک نمایش و پایگاه احضار:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'mythic_titan', label: 'تایتان اساطیری' },
                    { id: 'summon_arena', label: 'عرصه احضار ۳بعدی' },
                    { id: 'gilded_card', label: 'کارت زرین کلکسیونی' },
                    { id: 'crystal_prism', label: 'منشور کریستالی' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleUpdateCosmetic('visualStyle' as any, style.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-black border transition-colors ${
                        (currentMonster.cosmetics.visualStyle || 'mythic_titan') === style.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette Picker */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-2">رنگ هاله و انرژی هیولا:</label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {[
                    { color: '#ef4444', label: 'قرمز آتشی' },
                    { color: '#06b6d4', label: 'آبی یخی' },
                    { color: '#22c55e', label: 'زمردی' },
                    { color: '#eab308', label: 'طلایی صاعقه' },
                    { color: '#a855f7', label: 'ارغوانی تاریکی' },
                    { color: '#f59e0b', label: 'کهربایی خورشید' },
                    { color: '#0f172a', label: 'آبسیدین تیره' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => handleUpdateCosmetic('bodyColor', c.color)}
                      className={`w-9 h-9 rounded-2xl border-2 transition-transform ${
                        currentMonster.cosmetics.bodyColor === c.color ? 'scale-110 border-amber-500 ring-2 ring-amber-400 shadow-md' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Horn Style */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-2">مدل تاج، شاخ و بال‌ها:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dragon', label: 'اژدهای آتشین' },
                    { id: 'crown', label: 'تاج زرین تایتان' },
                    { id: 'crystal', label: 'کریستال کیهانی' },
                    { id: 'demon', label: 'شاخ‌های دیمن' },
                    { id: 'curved', label: 'شاخ‌های خمیده' },
                    { id: 'none', label: 'بدون شاخ' },
                  ].map((horn) => (
                    <button
                      key={horn.id}
                      onClick={() => handleUpdateCosmetic('hornType', horn.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-colors ${
                        currentMonster.cosmetics.hornType === horn.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {horn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aura Effects */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-2">افکت هاله و انرژی محیطی (Aura):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'flames', label: 'شعله‌های آتشفشانی' },
                    { id: 'lightning_sparks', label: 'جرقه‌های صاعقه' },
                    { id: 'divine_ring', label: 'حلقه مقدس نور' },
                    { id: 'void_particles', label: 'ذرات سیاهچاله خلاء' },
                    { id: 'none', label: 'بدون هاله' },
                  ].map((aura) => (
                    <button
                      key={aura.id}
                      onClick={() => handleUpdateCosmetic('auraEffect', aura.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-colors ${
                        currentMonster.cosmetics.auraEffect === aura.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {aura.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TRAINER & CHARACTER CUSTOMIZATION */}
          {currentTab === 'trainer' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center shadow-xs">
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center font-black text-amber-600 text-xl">
                    {trainer.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">{trainer.name}</h4>
                  <span className="text-xs text-amber-800 font-black bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    {trainer.titleFa}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-2">عنوان افتخاری مربی:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'استاد پرورش هیولاها',
                    'فاتح لیگ فصلی آرنا',
                    'فرمانده ارشد اتحاد',
                    'شکارچی تایتان‌های باستانی',
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        sounds.playClick();
                        onUpdateTrainer({ ...trainer, titleFa: t });
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-black border text-right transition-colors ${
                        trainer.titleFa === t
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-2">رنگ کادر آواتار:</label>
                <div className="flex items-center gap-2">
                  {['#f59e0b', '#06b6d4', '#ef4444', '#a855f7', '#10b981'].map((fc) => (
                    <button
                      key={fc}
                      onClick={() => {
                        sounds.playClick();
                        onUpdateTrainer({ ...trainer, frameColor: fc });
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        trainer.frameColor === fc ? 'scale-125 border-amber-600 ring-2 ring-amber-400' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: fc }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
