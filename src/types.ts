export type ElementType = 'fire' | 'water' | 'earth' | 'thunder' | 'void' | 'light';

export interface MonsterSkill {
  id: string;
  name: string;
  nameFa: string;
  element: ElementType;
  type: 'attack' | 'heal' | 'buff' | 'debuff' | 'ultimate';
  power: number;
  energyCost: number;
  cooldown: number;
  currentCooldown?: number;
  description: string;
  descriptionFa: string;
  iconName: string;
  levelRequired: number;
  unlocked: boolean;
  upgradeLevel: number;
  maxUpgradeLevel: number;
}

export interface MonsterCosmetics {
  bodyColor: string;
  accentColor: string;
  glowColor: string;
  hornType: 'dragon' | 'demon' | 'curved' | 'crown' | 'crystal' | 'none';
  eyeStyle: 'fiery' | 'void_glow' | 'cyber' | 'mystic' | 'beast';
  auraEffect: 'flames' | 'lightning_sparks' | 'void_particles' | 'divine_ring' | 'toxic_mist' | 'none';
  skinPattern: 'smooth' | 'scales' | 'runic' | 'cybernetic' | 'shadow';
  armorStyle: 'light' | 'obsidian' | 'golden_plate' | 'none';
  visualStyle?: 'mythic_titan' | 'summon_arena' | 'gilded_card' | 'crystal_prism';
}

export interface Monster {
  id: string;
  name: string;
  nameFa: string;
  species: string;
  speciesFa: string;
  element: ElementType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  level: number;
  xp: number;
  maxXp: number;
  evolutionStage: number; // 1 to 3
  maxEvolutionStage: number;
  // Stats
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  critChance: number; // e.g. 0.15 = 15%
  trainingPoints: number;
  // Skills
  skills: MonsterSkill[];
  // Cosmetics
  cosmetics: MonsterCosmetics;
  avatarVariant: number;
  imageUrl?: string;
  loreTitleFa?: string;
  loreBackstoryFa?: string;
  loreChantFa?: string;
  loreTraitFa?: string;
  loreSummonChantFa?: string;
  loreHiddenTraitFa?: string;
  affinityTrained: {
    attack: number;
    defense: number;
    speed: number;
    hp: number;
  };
}

export interface TrainerCustomization {
  name: string;
  avatarId: string;
  title: string;
  titleFa: string;
  badge: string;
  frameColor: string;
}

export type LeagueTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';

export interface LeagueInfo {
  tier: LeagueTier;
  tierFa: string;
  minTrophies: number;
  maxTrophies: number;
  badgeColor: string;
  icon: string;
  seasonReward: {
    gold: number;
    gems: number;
    rareItemName: string;
    rareItemNameFa: string;
  };
}

export interface ShopItem {
  id: string;
  name: string;
  nameFa: string;
  category: 'egg' | 'rune' | 'potion' | 'cosmetic' | 'upgrade_tome';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  price: number;
  currency: 'gold' | 'gems' | 'clanCoins';
  description: string;
  descriptionFa: string;
  icon: string;
  effect: {
    type: 'xp' | 'egg_hatch' | 'stat_boost' | 'skill_upgrade' | 'cosmetic_unlock' | 'energy_refill';
    value?: number;
    rarityEgg?: 'rare' | 'epic' | 'legendary';
    cosmeticType?: string;
  };
  stock?: number;
}

export interface AllianceMember {
  id: string;
  name: string;
  role: 'Leader' | 'Co-Leader' | 'Elder' | 'Member';
  roleFa: string;
  trophies: number;
  donations: number;
  isOnline: boolean;
  avatarId: string;
  activeMonsterName: string;
  activeMonsterElement: ElementType;
}

export interface AlliancePerk {
  id: string;
  name: string;
  nameFa: string;
  descriptionFa: string;
  level: number;
  maxLevel: number;
  costGold: number;
  costGems: number;
  icon: string;
  bonusPercent: number;
}

export interface AllianceWarLog {
  id: string;
  enemyClan: string;
  ourScore: number;
  theirScore: number;
  result: 'win' | 'loss' | 'ongoing';
  timestamp: string;
  starsGained: number;
}

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  emblem: string;
  color: string;
  level: number;
  xp: number;
  maxXp: number;
  description: string;
  members: AllianceMember[];
  treasuryGold: number;
  treasuryGems: number;
  trophies: number;
  warWins: number;
  warLosses: number;
  currentWar: {
    opponentClan: string;
    opponentEmblem: string;
    ourStars: number;
    theirStars: number;
    endTimeMinutes: number;
    logs: { attacker: string; stars: number; timestamp: string }[];
  } | null;
  perks: AlliancePerk[];
}

export interface TeamQuest {
  id: string;
  title: string;
  titleFa: string;
  descriptionFa: string;
  bossName: string;
  bossNameFa: string;
  bossElement: ElementType;
  bossHp: number;
  bossMaxHp: number;
  rewardGold: number;
  rewardGems: number;
  rewardClanCoins: number;
  participants: { name: string; damage: number; ready: boolean; avatar: string }[];
  completed: boolean;
  durationMinutes: number;
}

export interface ChatMessage {
  id: string;
  channel: 'global' | 'alliance' | 'battle' | 'party';
  senderId: string;
  senderName: string;
  senderTag?: string;
  avatar: string;
  message: string;
  timestamp: string;
  isVoiceNote?: boolean;
  voiceDurationSec?: number;
  isSystem?: boolean;
  badge?: string;
}

export interface LeaderboardPlayer {
  rank: number;
  id: string;
  name: string;
  allianceTag?: string;
  trophies: number;
  league: LeagueTier;
  winRate: number;
  topMonsterName: string;
  topMonsterElement: ElementType;
  topMonsterPower: number;
  avatar: string;
}

export interface DailyReward {
  day: number;
  titleFa: string;
  gold: number;
  gems: number;
  itemFa?: string;
  icon: string;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  titleFa: string;
  descFa: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  rewardGems: number;
  icon: string;
}
