import React, { useState, useEffect } from 'react';
import { Monster, MonsterSkill, ElementType } from '../types';
import { MonsterRenderer } from './MonsterRenderer';
import { ELEMENT_ADVANTAGES, getMonsterArtwork } from '../data/gameData';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Zap, 
  Shield, 
  Flame, 
  Droplets, 
  Sparkles, 
  Swords, 
  Award, 
  Trophy, 
  RefreshCw, 
  Heart, 
  ArrowRight,
  ShieldAlert,
  Bot,
  MessageSquare,
  UserPlus,
  Send,
  HelpCircle,
  TrendingUp,
  X
} from 'lucide-react';

interface BattleArenaProps {
  playerMonster: Monster;
  playerTrophies: number;
  onBattleEnd: (result: 'win' | 'loss', trophiesChange: number, goldGained: number, xpGained: number) => void;
  onExit: () => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  playerMonster,
  playerTrophies,
  onBattleEnd,
  onExit,
}) => {
  // Matchmaking state
  const [matchState, setMatchState] = useState<'searching' | 'found' | 'battle' | 'ended'>('searching');
  const [opponent, setOpponent] = useState<{
    trainerName: string;
    allianceTag: string;
    trophies: number;
    monster: Monster;
  } | null>(null);

  // Battle dynamic states
  const [playerHp, setPlayerHp] = useState(playerMonster.hp);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [playerShield, setPlayerShield] = useState(0);

  const [enemyHp, setEnemyHp] = useState(400);
  const [enemyMaxHp, setEnemyMaxHp] = useState(400);
  const [enemyEnergy, setEnemyEnergy] = useState(100);
  const [enemyShield, setEnemyShield] = useState(0);

  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [turnCount, setTurnCount] = useState(1);
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'victory' | 'defeated'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit' | 'victory' | 'defeated'>('idle');

  const [combatLogs, setCombatLogs] = useState<{ text: string; type: 'player' | 'enemy' | 'system' }[]>([]);
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({});
  const [battleResult, setBattleResult] = useState<'win' | 'loss' | null>(null);
  const [rewards, setRewards] = useState<{ trophies: number; gold: number; xp: number }>({ trophies: 0, gold: 0, xp: 0 });
  const [isAutoBattle, setIsAutoBattle] = useState(false);

  // AI Tactical Strategist Coach State
  const [showAiTactics, setShowAiTactics] = useState(false);
  const [aiTacticsLoading, setAiTacticsLoading] = useState(false);
  const [aiTacticsData, setAiTacticsData] = useState<{
    tacticalTip: string;
    recommendedSkillType: string;
    winProbabilityPercent: number;
    battleCry: string;
  } | null>(null);

  // Post-Battle Opponent Lounge & Banter State
  const [showPostBattleLounge, setShowPostBattleLounge] = useState(false);
  const [opponentChatLoading, setOpponentChatLoading] = useState(false);
  const [opponentMessage, setOpponentMessage] = useState<string>('');
  const [playerChatInput, setPlayerChatInput] = useState('');
  const [postBattleMessages, setPostBattleMessages] = useState<{ sender: string; text: string; isPlayer: boolean }[]>([]);
  const [friendAdded, setFriendAdded] = useState(false);

  // Matchmaking simulation
  const startMatchmaking = () => {
    setMatchState('searching');
    setBattleResult(null);
    setPostBattleMessages([]);
    setFriendAdded(false);
    setShowPostBattleLounge(false);

    const oppNames = ['کوروش فاتح', 'سایه‌شکار آرنا', 'قهرمان رعدآسا', 'کیمیاگر یخ‌زده', 'فرمانده والکایر', 'داریوش پهلوان'];
    const oppElements: ElementType[] = ['fire', 'water', 'earth', 'thunder', 'void', 'light'];
    const chosenElem = oppElements[Math.floor(Math.random() * oppElements.length)];
    
    setTimeout(() => {
      const oppLevel = Math.max(1, playerMonster.level + Math.floor(Math.random() * 3) - 1);
      const baseHp = 360 + oppLevel * 45;
      
      const oppMonster: Monster = {
        id: `enemy_opp_${Date.now()}`,
        name: chosenElem === 'water' ? 'Glacia Leviathan' : chosenElem === 'thunder' ? 'Storm Griffin' : chosenElem === 'void' ? 'Astra Void' : chosenElem === 'light' ? 'Solaris Phoenix' : chosenElem === 'earth' ? 'Terra Golem' : 'Pyro Drake',
        nameFa: chosenElem === 'water' ? 'لویاتان یخی' : chosenElem === 'thunder' ? 'شاهین رعدآسا' : chosenElem === 'void' ? 'اژدهای کیهانی خلاء' : chosenElem === 'light' ? 'ققنوس خورشیدی' : chosenElem === 'earth' ? 'تایتان زمردین' : 'ایگنیس آتشین',
        species: 'Gladiator Beast',
        speciesFa: 'هیولای گلادیاتور',
        element: chosenElem,
        rarity: 'epic',
        level: oppLevel,
        xp: 100,
        maxXp: 400,
        evolutionStage: Math.min(3, Math.max(1, Math.floor(oppLevel / 3) + 1)),
        maxEvolutionStage: 3,
        hp: baseHp,
        maxHp: baseHp,
        attack: 48 + oppLevel * 8,
        defense: 38 + oppLevel * 6,
        speed: 42 + oppLevel * 5,
        critChance: 0.15,
        trainingPoints: 0,
        avatarVariant: 2,
        imageUrl: getMonsterArtwork(chosenElem),
        cosmetics: {
          bodyColor: chosenElem === 'water' ? '#0284c7' : chosenElem === 'thunder' ? '#eab308' : chosenElem === 'void' ? '#9333ea' : chosenElem === 'light' ? '#f59e0b' : chosenElem === 'earth' ? '#059669' : '#dc2626',
          accentColor: '#f59e0b',
          glowColor: '#38bdf8',
          hornType: 'dragon',
          eyeStyle: 'fiery',
          auraEffect: 'flames',
          skinPattern: 'scales',
          armorStyle: 'golden_plate',
        },
        affinityTrained: { attack: 0, defense: 0, speed: 0, hp: 0 },
        skills: [
          {
            id: 'opp_atk_1',
            name: 'Strike',
            nameFa: 'حمله ضربتی',
            element: chosenElem,
            type: 'attack',
            power: 45,
            energyCost: 20,
            cooldown: 0,
            description: '',
            descriptionFa: '',
            iconName: 'Zap',
            levelRequired: 1,
            unlocked: true,
            upgradeLevel: 1,
            maxUpgradeLevel: 5,
          },
          {
            id: 'opp_atk_2',
            name: 'Elemental Surge',
            nameFa: 'انفجار سهمگین عنصر',
            element: chosenElem,
            type: 'attack',
            power: 75,
            energyCost: 40,
            cooldown: 2,
            description: '',
            descriptionFa: '',
            iconName: 'Flame',
            levelRequired: 1,
            unlocked: true,
            upgradeLevel: 1,
            maxUpgradeLevel: 5,
          },
          {
            id: 'opp_buff',
            name: 'Rage Barrier',
            nameFa: 'سپر دفاعی کریستال',
            element: chosenElem,
            type: 'buff',
            power: 35,
            energyCost: 25,
            cooldown: 3,
            description: '',
            descriptionFa: '',
            iconName: 'Shield',
            levelRequired: 1,
            unlocked: true,
            upgradeLevel: 1,
            maxUpgradeLevel: 5,
          },
        ],
      };

      setOpponent({
        trainerName: oppNames[Math.floor(Math.random() * oppNames.length)],
        allianceTag: 'PHNX',
        trophies: playerTrophies + Math.floor(Math.random() * 80) - 40,
        monster: oppMonster,
      });

      setPlayerHp(playerMonster.maxHp);
      setPlayerEnergy(100);
      setPlayerShield(0);
      setEnemyHp(baseHp);
      setEnemyMaxHp(baseHp);
      setEnemyEnergy(100);
      setEnemyShield(0);
      setTurn('player');
      setTurnCount(1);
      setMatchState('found');

      setTimeout(() => {
        setMatchState('battle');
        setCombatLogs([{ text: `⚔️ نبرد آغاز شد! حریف شما: ${oppMonster.nameFa}`, type: 'system' }]);
      }, 1600);
    }, 1800);
  };

  useEffect(() => {
    startMatchmaking();
  }, []);

  // Fetch AI Tactics from server
  const fetchAiTactics = async () => {
    if (!opponent) return;
    setAiTacticsLoading(true);
    setShowAiTactics(true);
    try {
      const res = await fetch('/api/gemini/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerMonster,
          enemyMonster: opponent.monster,
          playerHp,
          enemyHp,
          turnCount,
        }),
      });
      const data = await res.json();
      setAiTacticsData(data);
    } catch (e) {
      setAiTacticsData({
        tacticalTip: 'از برتری عنصری هیولا استفاده کنید و پس از دفاع در برابر ضربه سنگین حریف، مهارت نهایی را بزنید.',
        recommendedSkillType: 'ultimate',
        winProbabilityPercent: 78,
        battleCry: 'پیش به سوی پیروزی آرنا!',
      });
    } finally {
      setAiTacticsLoading(false);
    }
  };

  // Fetch AI Post-Battle Opponent Banter
  const fetchPostBattleOpponentChat = async (result: 'win' | 'loss') => {
    if (!opponent) return;
    setOpponentChatLoading(true);
    try {
      const res = await fetch('/api/gemini/opponent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentName: opponent.trainerName,
          result,
          playerMonsterName: playerMonster.nameFa,
          opponentMonsterName: opponent.monster.nameFa,
        }),
      });
      const data = await res.json();
      setOpponentMessage(data.messageFa);
      setPostBattleMessages([
        { sender: opponent.trainerName, text: data.messageFa, isPlayer: false },
      ]);
    } catch (e) {
      const defaultMsg = result === 'win'
        ? 'مبارزه فوق‌العاده‌ای بود! استراتژی عنصری تو واقعاً غافلگیرم کرد. دفعه بعد آماده‌تر میام!'
        : 'بازی خیلی خوبی بود! هیولای مقاومی داری، نبرد بسیار نزدیک بود.';
      setOpponentMessage(defaultMsg);
      setPostBattleMessages([
        { sender: opponent.trainerName, text: defaultMsg, isPlayer: false },
      ]);
    } finally {
      setOpponentChatLoading(false);
    }
  };

  // Send Post-Battle Quick Message / Emoji Sticker
  const handleSendPostBattleMsg = (textToSend?: string) => {
    const text = textToSend || playerChatInput.trim();
    if (!text) return;
    sounds.playClick();
    setPostBattleMessages((prev) => [
      ...prev,
      { sender: 'شما', text, isPlayer: true },
    ]);
    setPlayerChatInput('');

    // Simulate quick opponent reply if text sent
    if (!textToSend?.includes('🤝') && !textToSend?.includes('🔥')) {
      setTimeout(() => {
        setPostBattleMessages((prev) => [
          ...prev,
          { sender: opponent?.trainerName || 'حریف', text: 'ممنون از بازی خوبت! خوشحال میشم دوباره در آرنا با هم مبارزه کنیم.', isPlayer: false },
        ]);
      }, 1000);
    }
  };

  // Check Elemental Advantage
  const calculateDamage = (attackerElem: ElementType, defenderElem: ElementType, basePower: number, atkStat: number, defStat: number) => {
    let multiplier = 1.0;
    const adv = ELEMENT_ADVANTAGES[attackerElem];
    if (adv?.strongAgainst?.includes(defenderElem)) {
      multiplier = 1.45;
    } else if (adv?.weakAgainst?.includes(defenderElem)) {
      multiplier = 0.75;
    }

    const isCrit = Math.random() < 0.2;
    if (isCrit) multiplier *= 1.5;

    const raw = (atkStat * 1.3) + (basePower * 1.5) - (defStat * 0.6);
    const finalDmg = Math.max(15, Math.floor(raw * multiplier));
    return { damage: finalDmg, multiplier, isCrit };
  };

  // Player executes a skill
  const handleUseSkill = (skill: MonsterSkill) => {
    if (turn !== 'player' || matchState !== 'battle' || playerHp <= 0 || enemyHp <= 0) return;
    if (playerEnergy < skill.energyCost) return;
    if (skillCooldowns[skill.id] && skillCooldowns[skill.id] > 0) return;

    sounds.playClick();
    setPlayerEnergy((prev) => Math.max(0, prev - skill.energyCost));

    if (skill.cooldown > 0) {
      setSkillCooldowns((prev) => ({ ...prev, [skill.id]: skill.cooldown }));
    }

    if (skill.type === 'attack' || skill.type === 'ultimate') {
      if (skill.type === 'ultimate') {
        sounds.playUltimate();
      }
      setPlayerAnim('attack');
      setTimeout(() => {
        setPlayerAnim('idle');
        setEnemyAnim('hit');
        sounds.playHit(skill.element);

        if (!opponent) return;
        const { damage, multiplier, isCrit } = calculateDamage(
          skill.element, 
          opponent.monster.element, 
          skill.power, 
          playerMonster.attack, 
          opponent.monster.defense
        );

        let actualDmg = damage;
        if (enemyShield > 0) {
          const absorbed = Math.min(enemyShield, actualDmg);
          setEnemyShield((s) => Math.max(0, s - actualDmg));
          actualDmg -= absorbed;
        }

        const newEnemyHp = Math.max(0, enemyHp - actualDmg);
        setEnemyHp(newEnemyHp);

        const advText = multiplier > 1.2 ? ' (اثربخش و برتر!)' : multiplier < 0.9 ? ' (ضعیف روی عنصر حریف)' : '';
        const critText = isCrit ? ' 💥 ضربه بحرانی (کریتیکال)!' : '';
        setCombatLogs((prev) => [
          { text: `🗡️ شما از [${skill.nameFa}] استفاده کردید و ${actualDmg} خسارت وارد کردید!${advText}${critText}`, type: 'player' },
          ...prev.slice(0, 8),
        ]);

        setTimeout(() => setEnemyAnim('idle'), 400);

        if (newEnemyHp <= 0) {
          handleVictory();
        } else {
          setTurn('enemy');
        }
      }, 450);

    } else if (skill.type === 'buff' || skill.type === 'heal') {
      sounds.playRadioPing();
      setPlayerAnim('victory');
      const shieldAmount = Math.floor(playerMonster.defense * 1.5 + skill.power * 2);
      setPlayerShield((s) => s + shieldAmount);
      setPlayerHp((h) => Math.min(playerMonster.maxHp, h + Math.floor(skill.power * 1.5)));
      setCombatLogs((prev) => [
        { text: `🛡️ شما از [${skill.nameFa}] استفاده کردید: +${shieldAmount} سپر دفاعی و بازیابی سلامت!`, type: 'player' },
        ...prev.slice(0, 8),
      ]);
      setTimeout(() => {
        setPlayerAnim('idle');
        setTurn('enemy');
      }, 500);
    }
  };

  // Enemy Turn AI
  useEffect(() => {
    if (turn !== 'enemy' || matchState !== 'battle' || enemyHp <= 0 || playerHp <= 0 || !opponent) return;

    const aiTimer = setTimeout(() => {
      setEnemyEnergy((e) => Math.min(100, e + 25));

      const availableSkills = opponent.monster.skills;
      const chosenSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)] || availableSkills[0];

      setEnemyAnim('attack');
      setTimeout(() => {
        setEnemyAnim('idle');
        setPlayerAnim('hit');
        sounds.playHit(chosenSkill.element);

        if (chosenSkill.type === 'buff') {
          const eShield = 65;
          setEnemyShield((s) => s + eShield);
          setCombatLogs((prev) => [
            { text: `🛡️ حریف از [${chosenSkill.nameFa}] استفاده کرد و سپر دفاعی ساخت!`, type: 'enemy' },
            ...prev.slice(0, 8),
          ]);
        } else {
          const { damage, isCrit } = calculateDamage(
            chosenSkill.element,
            playerMonster.element,
            chosenSkill.power,
            opponent.monster.attack,
            playerMonster.defense
          );

          let actualDmg = damage;
          if (playerShield > 0) {
            const absorbed = Math.min(playerShield, actualDmg);
            setPlayerShield((s) => Math.max(0, s - actualDmg));
            actualDmg -= absorbed;
          }

          const newPlayerHp = Math.max(0, playerHp - actualDmg);
          setPlayerHp(newPlayerHp);

          const critText = isCrit ? ' 💥 ضربه کریتیکال حریف!' : '';
          setCombatLogs((prev) => [
            { text: `⚡ حریف با [${chosenSkill.nameFa}] به شما ${actualDmg} آسیب زد!${critText}`, type: 'enemy' },
            ...prev.slice(0, 8),
          ]);

          if (newPlayerHp <= 0) {
            handleDefeat();
            return;
          }
        }

        setTimeout(() => setPlayerAnim('idle'), 400);

        setPlayerEnergy((e) => Math.min(100, e + 30));
        setSkillCooldowns((prev) => {
          const updated: Record<string, number> = {};
          (Object.entries(prev) as [string, number][]).forEach(([k, v]) => {
            if (v > 1) updated[k] = v - 1;
          });
          return updated;
        });

        setTurnCount((c) => c + 1);
        setTurn('player');
      }, 500);

    }, 1100);

    return () => clearTimeout(aiTimer);
  }, [turn, matchState, enemyHp, playerHp]);

  // Auto battle helper
  useEffect(() => {
    if (isAutoBattle && turn === 'player' && matchState === 'battle' && playerHp > 0 && enemyHp > 0) {
      const readySkills = playerMonster.skills.filter(
        (s) => playerEnergy >= s.energyCost && (!skillCooldowns[s.id] || skillCooldowns[s.id] <= 0)
      );
      if (readySkills.length > 0) {
        const bestSkill = readySkills.sort((a, b) => b.power - a.power)[0];
        const autoTimer = setTimeout(() => {
          handleUseSkill(bestSkill);
        }, 600);
        return () => clearTimeout(autoTimer);
      }
    }
  }, [isAutoBattle, turn, playerEnergy, skillCooldowns, matchState]);

  // Victory
  const handleVictory = () => {
    sounds.playVictory();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setPlayerAnim('victory');
    setEnemyAnim('defeated');
    setBattleResult('win');
    setMatchState('ended');

    const gainedTrophies = 32 + Math.floor(Math.random() * 8);
    const gainedGold = 240 + playerMonster.level * 30;
    const gainedXp = 120 + playerMonster.level * 25;

    setRewards({ trophies: gainedTrophies, gold: gainedGold, xp: gainedXp });
    onBattleEnd('win', gainedTrophies, gainedGold, gainedXp);
    fetchPostBattleOpponentChat('win');
  };

  // Defeat
  const handleDefeat = () => {
    setPlayerAnim('defeated');
    setEnemyAnim('victory');
    setBattleResult('loss');
    setMatchState('ended');

    const lostTrophies = Math.min(playerTrophies, 18);
    const consolationGold = 50;
    const consolationXp = 30;

    setRewards({ trophies: -lostTrophies, gold: consolationGold, xp: consolationXp });
    onBattleEnd('loss', -lostTrophies, consolationGold, consolationXp);
    fetchPostBattleOpponentChat('loss');
  };

  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-5 h-5 text-red-500" />;
      case 'Droplets': return <Droplets className="w-5 h-5 text-cyan-500" />;
      case 'Shield': return <Shield className="w-5 h-5 text-emerald-500" />;
      case 'Zap': return <Zap className="w-5 h-5 text-amber-500" />;
      default: return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="relative w-full min-h-[660px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-slate-100 rounded-3xl border border-slate-700/80 p-4 md:p-6 overflow-hidden flex flex-col justify-between shadow-2xl">
      
      {/* Background stadium atmospheric aura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-purple-900/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none" />

      {/* MATCHMAKING SCREEN */}
      {matchState === 'searching' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-amber-400/40 border-t-amber-400 animate-spin flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Swords className="w-12 h-12 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">در حال جستجوی حریف در آرنای اساطیری...</h3>
            <p className="text-sm text-slate-400 mt-2">تطبیق سرور بر اساس رتبه لیگ ({playerTrophies.toLocaleString()} کاپ)</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-800/90 border border-slate-700 px-6 py-3 rounded-2xl shadow-md">
            <MonsterRenderer monster={playerMonster} size="sm" />
            <div className="text-right">
              <p className="text-sm font-black text-amber-400">{playerMonster.nameFa}</p>
              <p className="text-xs text-slate-400 font-bold">سطح {playerMonster.level} • عنصر {ELEMENT_ADVANTAGES[playerMonster.element]?.labelFa}</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-colors border border-slate-700"
          >
            لغو جستجو
          </button>
        </div>
      )}

      {/* OPPONENT FOUND SCREEN */}
      {matchState === 'found' && opponent && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-5 py-2 rounded-full font-extrabold text-sm shadow-md">
            <Swords className="w-4 h-4 text-emerald-400" /> حریف آماده است! ورود به صحنه نبرد
          </div>
          <div className="grid grid-cols-2 gap-6 items-center max-w-lg w-full">
            <div className="bg-slate-800/90 border border-amber-400/40 p-5 rounded-3xl text-center shadow-lg">
              <p className="text-xs font-bold text-amber-400">شما</p>
              <p className="text-sm font-black text-white">{playerMonster.nameFa}</p>
              <div className="my-3 flex justify-center">
                <MonsterRenderer monster={playerMonster} size="sm" />
              </div>
              <p className="text-xs font-bold text-slate-400">{playerTrophies} کاپ</p>
            </div>
            <div className="bg-slate-800/90 border border-rose-500/40 p-5 rounded-3xl text-center shadow-lg">
              <p className="text-xs font-bold text-rose-400">[{opponent.allianceTag}] {opponent.trainerName}</p>
              <p className="text-sm font-black text-white">{opponent.monster.nameFa}</p>
              <div className="my-3 flex justify-center">
                <MonsterRenderer monster={opponent.monster} size="sm" isEnemy />
              </div>
              <p className="text-xs font-bold text-slate-400">{opponent.trophies} کاپ</p>
            </div>
          </div>
          <p className="text-sm text-amber-400 font-extrabold animate-pulse">ورود به صحنه نبرد...</p>
        </div>
      )}

      {/* ACTIVE BATTLE OR ENDED SCREEN */}
      {(matchState === 'battle' || matchState === 'ended') && opponent && (
        <>
          {/* Top Status Bar: Opponent & Player Info */}
          <div className="flex items-center justify-between gap-4 bg-slate-800/90 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-2xl shadow-md">
            {/* Player Quick Bar */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center font-black text-amber-400 shadow-xs">
                L{playerMonster.level}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white">{playerMonster.nameFa}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ELEMENT_ADVANTAGES[playerMonster.element]?.bg}`}>
                    {ELEMENT_ADVANTAGES[playerMonster.element]?.labelFa}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-28 md:w-36 h-2.5 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300 shadow-xs shadow-emerald-400"
                      style={{ width: `${(playerHp / playerMonster.maxHp) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">{playerHp}/{playerMonster.maxHp}</span>
                  {playerShield > 0 && (
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40 px-1.5 py-0.2 rounded-md">
                      +{playerShield} سپر
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Turn Counter & Controls */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full shadow-md ${
                  turn === 'player' 
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {turn === 'player' ? '⚡ نوبت شما' : '⏳ نوبت حریف'}
                </span>
                
                {/* AI Battle Strategist Button */}
                <button
                  onClick={fetchAiTactics}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs hover:brightness-110 flex items-center gap-1"
                  title="تحلیل هوشمند نبرد با هوش مصنوعی"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  مربی AI
                </button>

                <button
                  onClick={() => setIsAutoBattle(!isAutoBattle)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors ${
                    isAutoBattle 
                      ? 'bg-purple-500/30 text-purple-300 border-purple-400' 
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:text-white'
                  }`}
                  title="نبرد خودکار"
                >
                  <Bot className="w-3.5 h-3.5" /> خودکار {isAutoBattle && '✓'}
                </button>
              </div>
              <span className="text-[11px] font-bold text-slate-400">نوبت {turnCount}</span>
            </div>

            {/* Enemy Quick Bar */}
            <div className="flex items-center gap-3 text-left dir-ltr">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center font-black text-rose-400 shadow-xs">
                L{opponent.monster.level}
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="font-black text-sm text-white">{opponent.monster.nameFa}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ELEMENT_ADVANTAGES[opponent.monster.element]?.bg}`}>
                    {ELEMENT_ADVANTAGES[opponent.monster.element]?.labelFa}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  {enemyShield > 0 && (
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40 px-1.5 py-0.2 rounded-md">
                      +{enemyShield} سپر
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-rose-400">{enemyHp}/{enemyMaxHp}</span>
                  <div className="w-28 md:w-36 h-2.5 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-red-400 transition-all duration-300 shadow-xs shadow-rose-400"
                      style={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI TACTICAL COACH POPUP DRAWER */}
          {showAiTactics && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 border border-purple-200 rounded-2xl p-4 my-2 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h4 className="text-sm font-extrabold text-purple-900">مشاوره تاکتیکی هوش مصنوعی آرنا</h4>
                </div>
                <button onClick={() => setShowAiTactics(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {aiTacticsLoading ? (
                <div className="flex items-center justify-center py-4 text-xs text-purple-700 font-bold gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-600" /> در حال تحلیل نقاط ضعف و استراتژی عنصری...
                </div>
              ) : aiTacticsData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="md:col-span-2 bg-white/90 p-3 rounded-xl border border-purple-200/80">
                    <p className="font-bold text-slate-800 leading-relaxed">{aiTacticsData.tacticalTip}</p>
                    <p className="text-[11px] text-amber-700 font-extrabold mt-1.5 flex items-center gap-1">
                      🔥 غرش نبرد: «{aiTacticsData.battleCry}»
                    </p>
                  </div>
                  <div className="bg-white/90 p-3 rounded-xl border border-purple-200/80 flex flex-col justify-center items-center text-center">
                    <span className="text-[11px] text-slate-500 font-bold">احتمال پیروزی شما</span>
                    <span className="text-xl font-black text-purple-700 font-mono mt-0.5">{aiTacticsData.winProbabilityPercent}%</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                      اولویت: {aiTacticsData.recommendedSkillType === 'ultimate' ? 'آلتیمیت' : 'حمله قدرتی'}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* MAIN ARENA STAGE (Monsters Facing Each Other) */}
          <div className="relative flex-1 min-h-[250px] flex items-center justify-between px-6 md:px-14 my-3">
            
            {/* Player Side */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <MonsterRenderer 
                  monster={playerMonster} 
                  size="battle" 
                  animationState={playerAnim} 
                />
                {/* Energy Bar below monster */}
                <div className="w-32 mt-2 bg-slate-200 border border-slate-300 rounded-full h-2 overflow-hidden shadow-xs">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                    style={{ width: `${playerEnergy}%` }}
                  />
                </div>
                <p className="text-[11px] text-center text-amber-800 mt-0.5 font-bold">انرژی: {playerEnergy}/100</p>
              </div>
            </div>

            {/* Center VS & Elemental Advantage Badge */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white border border-amber-300 flex items-center justify-center shadow-md shadow-amber-500/10">
                <Swords className="w-6 h-6 text-amber-600" />
              </div>
              {ELEMENT_ADVANTAGES[playerMonster.element]?.strongAgainst?.includes(opponent.monster.element) && (
                <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl text-[11px] font-extrabold shadow-xs">
                  🔥 عنصر شما برتر است (+45%)
                </div>
              )}
              {ELEMENT_ADVANTAGES[playerMonster.element]?.weakAgainst?.includes(opponent.monster.element) && (
                <div className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-xl text-[11px] font-extrabold shadow-xs">
                  ⚠️ ضعف عنصری (-25%)
                </div>
              )}
            </div>

            {/* Opponent Side */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <MonsterRenderer 
                  monster={opponent.monster} 
                  size="battle" 
                  animationState={enemyAnim} 
                  isEnemy 
                />
                {/* Enemy Energy Bar */}
                <div className="w-32 mt-2 bg-slate-200 border border-slate-300 rounded-full h-2 overflow-hidden shadow-xs">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300"
                    style={{ width: `${enemyEnergy}%` }}
                  />
                </div>
                <p className="text-[11px] text-center text-cyan-800 mt-0.5 font-bold">انرژی حریف: {enemyEnergy}/100</p>
              </div>
            </div>
          </div>

          {/* Combat Log Box */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-2.5 max-h-20 overflow-y-auto mb-3 text-xs space-y-1 shadow-inner">
            {combatLogs.map((log, index) => (
              <div 
                key={index}
                className={`font-bold ${
                  log.type === 'player' 
                    ? 'text-amber-400' 
                    : log.type === 'enemy' 
                    ? 'text-rose-400' 
                    : 'text-slate-400'
                }`}
              >
                {log.text}
              </div>
            ))}
          </div>

          {/* Player Skill Action Deck */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {playerMonster.skills.map((skill) => {
              const cd = skillCooldowns[skill.id] || 0;
              const hasEnergy = playerEnergy >= skill.energyCost;
              const isDisabled = turn !== 'player' || matchState !== 'battle' || cd > 0 || !hasEnergy;
              const isUlt = skill.type === 'ultimate';

              return (
                <button
                  key={skill.id}
                  onClick={() => handleUseSkill(skill)}
                  disabled={isDisabled}
                  className={`relative p-3 rounded-2xl border text-right transition-all flex flex-col justify-between shadow-md ${
                    isUlt
                      ? 'bg-gradient-to-br from-purple-900/80 via-indigo-900/60 to-purple-950 border-purple-500/80 text-white shadow-purple-500/20'
                      : 'bg-slate-800/90 border-slate-700 hover:border-amber-400/80 text-white'
                  } ${
                    isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-black text-xs md:text-sm flex items-center gap-1.5 text-white">
                      {getSkillIcon(skill.iconName)}
                      {skill.nameFa}
                    </span>
                    <span className="text-[11px] font-mono font-black text-amber-400 bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.5 rounded-lg">
                      {skill.energyCost}⚡
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1">{skill.descriptionFa}</p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/60 text-[10px]">
                    <span className="text-emerald-400 font-bold">قدرت: {skill.power}</span>
                    {cd > 0 ? (
                      <span className="text-rose-400 font-bold">صبر: {cd} نوبت</span>
                    ) : (
                      <span className="text-cyan-400 font-extrabold">{skill.type === 'ultimate' ? '🌟 آلتیمیت' : 'آماده'}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* BATTLE END MODAL */}
          {matchState === 'ended' && battleResult && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-30">
              <div className="bg-white border border-amber-300 p-6 md:p-8 rounded-3xl max-w-lg w-full text-center space-y-5 shadow-2xl">
                {battleResult === 'win' ? (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center shadow-md">
                      <Trophy className="w-10 h-10 text-amber-600 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-amber-800">پیروزی درخشان در آرنا!</h3>
                      <p className="text-sm text-slate-600 mt-1">شما با استراتژی و تاکتیک‌های برتر، حریف را شکست دادید.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-rose-100 border-2 border-rose-400 flex items-center justify-center shadow-md">
                      <ShieldAlert className="w-10 h-10 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-rose-700">شکست در نبرد</h3>
                      <p className="text-sm text-slate-600 mt-1">هیولای خود را در مهد پرورش ارتقا دهید و مهارت‌های جدید باز کنید.</p>
                    </div>
                  </>
                )}

                {/* Rewards Breakdown */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 font-bold">جام‌ها</p>
                    <p className={`text-base font-extrabold mt-0.5 ${rewards.trophies >= 0 ? 'text-amber-700' : 'text-rose-600'}`}>
                      {rewards.trophies >= 0 ? `+${rewards.trophies}` : rewards.trophies} 🏆
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 font-bold">طلا</p>
                    <p className="text-base font-extrabold text-yellow-700 mt-0.5">+{rewards.gold} 🪙</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 font-bold">تجربه XP</p>
                    <p className="text-base font-extrabold text-cyan-700 mt-0.5">+{rewards.xp} ⚡</p>
                  </div>
                </div>

                {/* Post-Battle Opponent Lounge Preview */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 text-right">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      گفتگو با حریف: [{opponent?.allianceTag || 'RIVAL'}] {opponent?.trainerName || 'حریف'}
                    </span>
                    <button
                      onClick={() => setShowPostBattleLounge(!showPostBattleLounge)}
                      className="text-xs text-amber-800 font-extrabold underline"
                    >
                      {showPostBattleLounge ? 'بستن چت' : 'باز کردن لابی گفتگو'}
                    </button>
                  </div>

                  {opponentMessage && (
                    <p className="text-xs text-slate-700 italic bg-white/80 p-2.5 rounded-xl border border-amber-100">
                      «{opponentMessage}»
                    </p>
                  )}

                  {/* Expanded Post-Battle Lounge */}
                  {showPostBattleLounge && (
                    <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
                      <div className="max-h-28 overflow-y-auto space-y-1.5 text-xs">
                        {postBattleMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl text-right ${
                              msg.isPlayer ? 'bg-amber-100 text-amber-900 mr-4' : 'bg-white text-slate-800 ml-4 border border-slate-200'
                            }`}
                          >
                            <span className="font-extrabold text-[10px] block opacity-70">{msg.sender}:</span>
                            {msg.text}
                          </div>
                        ))}
                      </div>

                      {/* Quick Battle Stickers */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {[
                          'بازی عالی بود! 🤝',
                          'انتقام می‌گیرم! 🔥',
                          'خوب جنگیدی 👏',
                          'درخواست دوستی دارم! 🌟',
                        ].map((sticker, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendPostBattleMsg(sticker)}
                            className="px-2 py-1 bg-white border border-amber-200 text-slate-700 text-[11px] font-bold rounded-lg hover:bg-amber-100 whitespace-nowrap transition-colors"
                          >
                            {sticker}
                          </button>
                        ))}
                      </div>

                      {/* Custom Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={playerChatInput}
                          onChange={(e) => setPlayerChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendPostBattleMsg()}
                          placeholder="پیام به حریف..."
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => handleSendPostBattleMsg()}
                          className="p-1.5 bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setFriendAdded(true);
                    }}
                    disabled={friendAdded}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      friendAdded
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    {friendAdded ? 'درخواست دوستی ارسال شد ✓' : 'افزودن حریف به دوستان'}
                  </button>

                  <button
                    onClick={startMatchmaking}
                    className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    نبرد بعدی
                  </button>

                  <button
                    onClick={onExit}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
                  >
                    بازگشت به لابی مهد پرورش
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
