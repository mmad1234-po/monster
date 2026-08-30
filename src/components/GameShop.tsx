import React, { useState } from 'react';
import { ShopItem, Monster, ElementType } from '../types';
import { SHOP_ITEMS, getMonsterArtwork } from '../data/gameData';
import { MonsterRenderer } from './MonsterRenderer';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  ShoppingBag, 
  Sparkles, 
  Zap, 
  Shield, 
  BookOpen, 
  Coins, 
  Gem, 
  Egg, 
  Flame,
  Gift,
  Award,
  Crown,
  CheckCircle2,
  X
} from 'lucide-react';

interface GameShopProps {
  playerGold: number;
  playerGems: number;
  onSpendCurrency: (gold: number, gems: number) => boolean;
  onAddNewMonster: (monster: Monster) => void;
  onApplyShopEffect: (effect: ShopItem['effect']) => void;
}

export const GameShop: React.FC<GameShopProps> = ({
  playerGold,
  playerGems,
  onSpendCurrency,
  onAddNewMonster,
  onApplyShopEffect,
}) => {
  const [filter, setFilter] = useState<'all' | 'egg' | 'potion' | 'rune' | 'upgrade_tome' | 'cosmetic'>('all');
  const [hatchingMonster, setHatchingMonster] = useState<Monster | null>(null);
  const [isHatching, setIsHatching] = useState(false);
  const [hatchingRarity, setHatchingRarity] = useState<'rare' | 'epic' | 'legendary'>('rare');

  const filteredItems = filter === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((i) => i.category === filter);

  // Buy Shop Item
  const handleBuy = (item: ShopItem) => {
    const isGold = item.currency === 'gold';
    if (isGold && playerGold < item.price) {
      alert('طلای کافی ندارید! در آرنا بجنگید یا جوایز روزانه دریافت کنید.');
      return;
    }
    if (!isGold && playerGems < item.price) {
      alert('الماس کافی ندارید!');
      return;
    }

    if (!onSpendCurrency(isGold ? item.price : 0, isGold ? 0 : item.price)) return;
    sounds.playCoin();

    // Check if Egg Hatch
    if (item.effect.type === 'egg_hatch') {
      const rarity = item.effect.rarityEgg || 'rare';
      setHatchingRarity(rarity);
      triggerEggHatch(rarity);
    } else {
      sounds.playLevelUp();
      confetti({ particleCount: 70, spread: 60 });
      onApplyShopEffect(item.effect);
      alert(`🎉 با موفقیت خریداری شد: [${item.nameFa}]! اثر آن بلافاصله اعمال گردید.`);
    }
  };

  // Egg Hatch Animation & New Monster Creation
  const triggerEggHatch = (rarity: 'rare' | 'epic' | 'legendary') => {
    setIsHatching(true);
    sounds.playUltimate();

    const elements: ElementType[] = ['fire', 'water', 'earth', 'thunder', 'void', 'light'];
    const chosenElement = elements[Math.floor(Math.random() * elements.length)];
    const names = {
      fire: 'آذرخش سوزان',
      water: 'لویاتان اقیانوس',
      earth: 'غول سنگ و زمرد',
      thunder: 'شاهین رعدآسا',
      void: 'ارباب خلاء تاریک',
      light: 'ققنوس خورشیدی',
    };

    const newMonster: Monster = {
      id: `mon_hatched_${Date.now()}`,
      name: names[chosenElement],
      nameFa: names[chosenElement],
      species: `${chosenElement.toUpperCase()} Beast`,
      speciesFa: `هیولای عنصر ${chosenElement}`,
      element: chosenElement,
      rarity: rarity,
      level: 1,
      xp: 0,
      maxXp: 180,
      evolutionStage: 1,
      maxEvolutionStage: 3,
      hp: 350 + (rarity === 'legendary' ? 120 : rarity === 'epic' ? 60 : 20),
      maxHp: 350 + (rarity === 'legendary' ? 120 : rarity === 'epic' ? 60 : 20),
      attack: 50 + (rarity === 'legendary' ? 25 : rarity === 'epic' ? 15 : 5),
      defense: 40 + (rarity === 'legendary' ? 20 : rarity === 'epic' ? 12 : 5),
      speed: 45 + (rarity === 'legendary' ? 20 : rarity === 'epic' ? 10 : 5),
      critChance: rarity === 'legendary' ? 0.25 : 0.15,
      trainingPoints: 3,
      avatarVariant: Math.floor(Math.random() * 4) + 1,
      imageUrl: getMonsterArtwork(chosenElement),
      cosmetics: {
        bodyColor: chosenElement === 'fire' ? '#ef4444' : chosenElement === 'water' ? '#06b6d4' : chosenElement === 'thunder' ? '#eab308' : chosenElement === 'void' ? '#a855f7' : chosenElement === 'light' ? '#f59e0b' : '#22c55e',
        accentColor: '#f97316',
        glowColor: '#fef08a',
        hornType: rarity === 'legendary' ? 'crown' : 'dragon',
        eyeStyle: rarity === 'legendary' ? 'void_glow' : 'fiery',
        auraEffect: rarity === 'legendary' ? 'lightning_sparks' : 'flames',
        skinPattern: 'scales',
        armorStyle: 'golden_plate',
      },
      affinityTrained: { attack: 0, defense: 0, speed: 0, hp: 0 },
      skills: [
        {
          id: `skill_atk_${Date.now()}`,
          name: 'Elemental Burst',
          nameFa: 'انفجار عنصر اولیه',
          element: chosenElement,
          type: 'attack',
          power: 45,
          energyCost: 20,
          cooldown: 0,
          description: 'Basic elemental blast',
          descriptionFa: 'ضربه جادویی پایه با نیروی عنصر طبیعی.',
          iconName: 'Zap',
          levelRequired: 1,
          unlocked: true,
          upgradeLevel: 1,
          maxUpgradeLevel: 5,
        },
        {
          id: `skill_ult_${Date.now()}`,
          name: 'Cosmic Awakening',
          nameFa: 'بیداری کیهانی (نهایی)',
          element: chosenElement,
          type: 'ultimate',
          power: 130,
          energyCost: 75,
          cooldown: 4,
          description: 'Devastating ultimate blast',
          descriptionFa: 'ضربه فوق سنگین رهاسازی قدرت نهفته عنصر.',
          iconName: 'Sparkles',
          levelRequired: 3,
          unlocked: true,
          upgradeLevel: 1,
          maxUpgradeLevel: 5,
        },
      ],
    };

    setTimeout(() => {
      setIsHatching(false);
      setHatchingMonster(newMonster);
      onAddNewMonster(newMonster);
      sounds.playVictory();
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.5 } });
    }, 2200);
  };

  const getItemIcon = (iconName: string) => {
    switch (iconName) {
      case 'Egg': return <Egg className="w-6 h-6 text-amber-500" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-purple-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-cyan-400" />;
      case 'Shield': return <Shield className="w-6 h-6 text-emerald-400" />;
      case 'BookOpen': return <BookOpen className="w-6 h-6 text-amber-400" />;
      default: return <Gift className="w-6 h-6 text-rose-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Wallet Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                فروشگاه اسرارآمیز رِلم
              </h2>
              <p className="text-xs font-bold text-slate-300 mt-0.5">تخم‌های اساطیری، اکسیرهای ارتقا، کتاب‌های جادو و تجهیزات ویژه</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-slate-800/90 border border-slate-700/90 px-4 py-2.5 rounded-2xl shadow-md">
          <div className="flex items-center gap-1.5 font-black text-yellow-400 text-sm">
            <Coins className="w-4 h-4 text-yellow-400" /> {playerGold.toLocaleString()}
            <span className="text-[10px] text-slate-400 font-sans">طلا</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-1.5 font-black text-cyan-400 text-sm">
            <Gem className="w-4 h-4 text-cyan-400" /> {playerGems.toLocaleString()}
            <span className="text-[10px] text-slate-400 font-sans">الماس</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'همه آیتم‌ها' },
          { id: 'egg', label: 'تخم‌های هیولا (Gacha)' },
          { id: 'potion', label: 'اکسیرها و معجون‌ها' },
          { id: 'rune', label: 'کریستال‌های قدرت' },
          { id: 'upgrade_tome', label: 'کتاب‌های مهارت' },
          { id: 'cosmetic', label: 'شخصی‌سازی ظاهر' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => {
              sounds.playClick();
              setFilter(c.id as any);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap shadow-xs ${
              filter === c.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
                : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200/90'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isGold = item.currency === 'gold';
          const canAfford = isGold ? playerGold >= item.price : playerGems >= item.price;
          const isMythic = item.rarity === 'mythic';
          const isLegendary = item.rarity === 'legendary';

          return (
            <div
              key={item.id}
              className={`p-5 rounded-3xl flex flex-col justify-between space-y-4 transition-all duration-300 shadow-md ${
                isMythic
                  ? 'bg-gradient-to-b from-slate-900 via-purple-950/40 to-slate-900 border-2 border-purple-500/60 text-white shadow-purple-500/10'
                  : isLegendary
                  ? 'bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/60 text-white shadow-amber-500/10'
                  : 'bg-white border border-slate-200/90 text-slate-800 hover:border-amber-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
                    isMythic 
                      ? 'bg-purple-900/50 border-purple-400/40' 
                      : isLegendary 
                      ? 'bg-amber-900/50 border-amber-400/40' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    {getItemIcon(item.icon)}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    isMythic
                      ? 'bg-purple-500/30 text-purple-300 border-purple-400/50'
                      : isLegendary
                      ? 'bg-amber-500/30 text-amber-300 border-amber-400/50'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {item.rarity.toUpperCase()}
                  </span>
                </div>

                <h3 className={`text-base font-black ${isMythic || isLegendary ? 'text-white' : 'text-slate-900'}`}>
                  {item.nameFa}
                </h3>
                <p className={`text-xs font-bold mt-1.5 line-clamp-2 ${isMythic || isLegendary ? 'text-slate-300' : 'text-slate-500'}`}>
                  {item.descriptionFa}
                </p>
              </div>

              <button
                onClick={() => handleBuy(item)}
                disabled={!canAfford}
                className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md ${
                  canAfford
                    ? isGold
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/25'
                    : 'bg-slate-200/80 text-slate-400 cursor-not-allowed border border-slate-300/40'
                }`}
              >
                {isGold ? <Coins className="w-4 h-4 text-slate-950" /> : <Gem className="w-4 h-4 text-white" />}
                خرید با {item.price.toLocaleString()} {isGold ? 'طلا' : 'الماس'}
              </button>
            </div>
          );
        })}
      </div>

      {/* EGG HATCHING ANIMATION MODAL */}
      {isHatching && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="text-center space-y-6 bg-slate-900 border-2 border-amber-500/60 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-amber-500/30 to-purple-500/30 border-4 border-amber-400 border-t-transparent animate-spin flex items-center justify-center shadow-lg shadow-amber-500/40">
                <Egg className="w-16 h-16 text-amber-400 animate-egg-shake" />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-amber-400">تخم در حال شکستن است...</h3>
              <p className="text-xs font-bold text-slate-300 mt-2">امواج انرژی باستانی در حال تجلی یافتن هستند!</p>
            </div>
          </div>
        </div>
      )}

      {/* NEW HATCHED MONSTER REVEAL MODAL */}
      {hatchingMonster && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border-2 border-amber-400/80 p-6 md:p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <span className="text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-4 py-1.5 rounded-full shadow-md">
                🎉 هیولای جدید متولد شد!
              </span>
              <h3 className="text-2xl font-black text-white mt-3">{hatchingMonster.nameFa}</h3>
              <p className="text-xs font-bold text-slate-300 mt-1">عنصر {hatchingMonster.element} • کمیابی {hatchingMonster.rarity.toUpperCase()}</p>
            </div>

            <div className="my-3 flex justify-center">
              <MonsterRenderer monster={hatchingMonster} size="xl" />
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-xs shadow-inner">
              <div>
                <p className="text-slate-400 font-bold">حمله</p>
                <p className="font-black text-red-400 text-sm mt-0.5">{hatchingMonster.attack}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">دفاع</p>
                <p className="font-black text-emerald-400 text-sm mt-0.5">{hatchingMonster.defense}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">سلامت</p>
                <p className="font-black text-rose-400 text-sm mt-0.5">{hatchingMonster.maxHp}</p>
              </div>
            </div>

            <button
              onClick={() => setHatchingMonster(null)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
            >
              افزودن به پرورشگاه و ادامه
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
