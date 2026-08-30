# 🐲 Monster Realm: Arena of Alliances (دنیای هیولاها)
> **Comprehensive Developer & AI Architecture Guide**
> A full-stack Persian Fantasy RPG & Monster Tamer web game built with React 18, TypeScript, Tailwind CSS, Web Audio API, and an Express.js backend powered by the Gemini 3.7 Flash AI engine.

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Game Mechanics & Systems](#-key-game-mechanics--systems)
3. [Architecture & File Structure](#-architecture--file-structure)
4. [Backend & AI Endpoints (Gemini 3.7 Flash)](#-backend--ai-endpoints-gemini-37-flash)
5. [Frontend State Management & Persistence](#-frontend-state-management--persistence)
6. [Elemental Combat Engine & Mathematics](#-elemental-combat-engine--mathematics)
7. [Audio Engine (Web Audio API)](#-audio-engine-web-audio-api)
8. [Error Handling & Resilience](#-error-handling--resilience)
9. [Development, Build & Deployment Guide](#-development-build--deployment-guide)
10. [AI & Developer Extensibility Guide](#-ai--developer-extensibility-guide)

---

## 🌟 Project Overview
**Monster Realm** is a high-depth monster collector and tactical arena battler localized in Persian (Farsi RTL with English fallbacks). Players summon and evolve elemental monsters, battle in tactical turn-based arenas against AI and simulated PvP rivals, join alliances, compete in seasonal league ladders, and participate in voice-enabled party rooms.

### Core Pillars:
- **Zero Heavy External Assets**: Monster graphics are procedurally constructed using dynamic SVGs and CSS element animations (`MonsterRenderer.tsx`), making the game ultra-lightweight and instant-loading.
- **Synthesized Sound**: All sound effects (elemental hits, UI clicks, level-ups, victory chants) are generated at runtime via the Web Audio API without needing external `.mp3` files.
- **Server-Side AI Integration**: Gemini 3.7 Flash powers real-time in-game tactical battle coaching, dynamic monster lore generation, and post-battle opponent sportsmanship dialogues.
- **Safe Persistence**: Hybrid client-side caching with schema-safe hydration and fail-safe Error Boundaries.

---

## 🎮 Key Game Mechanics & Systems

### 1. 🐣 Monster Nursery & Evolution (`MonsterNursery.tsx`)
- **Evolution Stages (1 → 3)**: Monsters evolve visually and statistically when reaching specific levels and evolution stone thresholds.
- **Stat Training**: Players allocate Gold/Gems into 4 primary stats: `HP`, `Attack`, `Defense`, and `Speed`.
- **AI Mythological Lore**: Requests Gemini to generate Persian backstories, summoning chants, and unique traits based on the monster's element and rarity.
- **Trainer Customization**: Avatar selection, trainer title, and player profile configuration.

### 2. ⚔️ Battle Arena (`BattleArena.tsx`)
- **Turn-based Combat**: Speed-dependent turn calculations.
- **Energy & Ultimate Skill**: Basic actions build energy (0–100%); at 100%, devastating elemental Ultimate moves unlock with custom screen shakes and particle bursts.
- **AI Tactical Coach (`/api/gemini/tactics`)**: Real-time battle analyzer that inspects health ratios and elemental matchup to recommend strategic moves and compute win probabilities.
- **Post-Battle Rival Chat (`/api/gemini/opponent-chat`)**: Generates contextual, respectful, or witty banter from the defeated/victorious opponent with rematch options.

### 3. 🛡️ Alliance & Clan Wars (`AllianceHub.tsx`)
- **Alliance War (2-Attack Quota)**: Clan wars enforce a strict 2-attack quota per round to ensure balanced progression and prevent reward exploits.
- **Alliance Treasury & Perks**: Gold/Gem donations unlock clan-wide buffs (XP boosts, gold find bonuses).
- **Team Raids (Co-op Bosses)**: Multi-stage raid bosses with shared clan HP pools.
- **Clan Shop**: Exchange exclusive Clan Coins for rare evolution shards and ancient eggs.

### 4. 🏆 Seasonal Leagues & Trophy Road (`SeasonalLeagues.tsx`)
- 8 Distinct Competitive Tiers: Bronze (برنز), Silver (نقره), Gold (طلا), Platinum (پلاتین), Diamond (الماس), Master (استاد), Grandmaster (فرمانروای اعظم), and Legendary Realm (قلمرو افسانه‌ای).
- Season Pass progression ladder with automated milestone unlock tracking.

### 5. 🛒 Game Shop & Gacha (`GameShop.tsx`)
- Ancient & Legendary monster egg hatching with guaranteed rarity probabilities.
- Combat potions, evolution catalysts, and currency packages.

### 6. 🎙️ Social Hub & Voice Visualizer (`SocialChatVoice.tsx`)
- Tactical ping broadcast system, party invite code sharing with clipboard fallbacks.
- Live microphone stream analyzer (Web Audio `AnalyserNode`) rendering real-time voice frequency spectrums and simulated party room chatter.

---

## 📁 Architecture & File Structure

```
├── server.ts                       # Express backend + Gemini API routes + Vite dev/prod middleware
├── package.json                    # Project scripts & dependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite + Tailwind CSS plugin setup
├── metadata.json                   # AI Studio applet metadata & capabilities
├── .env.example                    # Environment variable definitions (GEMINI_API_KEY)
├── src/
│   ├── main.tsx                    # React DOM entry point
│   ├── App.tsx                     # Main Router, Global State, Safe Hydration & Navigation
│   ├── index.css                   # Tailwind CSS styling & custom RTL utilities
│   ├── types.ts                    # Master TypeScript definitions, enums & initial mock datasets
│   ├── utils/
│   │   └── audio.ts                # Web Audio API sound synthesizer engine
│   └── components/
│       ├── ErrorBoundary.tsx       # Fault-tolerant UI crash isolation boundary
│       ├── MonsterRenderer.tsx     # Procedural SVG creature generation & animation engine
│       ├── MonsterNursery.tsx      # Nursery, breeding, evolution & lore viewer
│       ├── BattleArena.tsx         # Combat engine, AI battle coach & opponent interactions
│       ├── AllianceHub.tsx         # Alliance wars, clan treasury, perks & team raids
│       ├── SeasonalLeagues.tsx     # Trophy Road, league rankings & seasonal ladders
│       ├── GameShop.tsx            # In-game gacha, egg hatchery & item store
│       └── SocialChatVoice.tsx     # Tactical chat, achievements & Web Audio voice rooms
```

---

## 🤖 Backend & AI Endpoints (Gemini 3.7 Flash)

The server runs on **Express (`server.ts`)** and binds to port `3000`. All AI logic runs strictly server-side using `@google/genai` to ensure the API key is never exposed to the client.

### 1. `POST /api/gemini/tactics`
- **Purpose**: Real-time battle tactician during arena matches.
- **Input**: `{ playerMonster, enemyMonster, playerHp, enemyHp, turnCount }`
- **Output JSON**:
  ```json
  {
    "tacticalTip": "عنصر آتش در برابر این حریف برتری دارد...",
    "recommendedSkillType": "attack" | "defense" | "ultimate",
    "winProbabilityPercent": 78,
    "battleCry": "شعله‌های پیروزی را برافروز!"
  }
  ```
- **Fallback**: If `GEMINI_API_KEY` is not provided or network fails, a deterministic tactical response is returned without throwing errors.

### 2. `POST /api/gemini/monster-lore`
- **Purpose**: Generates Persian mythological origins, summoning chants, and hidden passives for newly hatched or inspected monsters.
- **Input**: `{ monster }`
- **Output JSON**:
  ```json
  {
    "loreTitleFa": "نگهبان کهن گدازه‌های ابدی",
    "loreBackstoryFa": "متولد شده در ژرفای کوه‌های آتشفشانی...",
    "loreSummonChantFa": "از میان خاکستر و شعله برخیز!",
    "loreHiddenTraitFa": "افزایش ۱۵٪ شانس ضربه بحرانی در نبردهای حماسی"
  }
  ```

### 3. `POST /api/gemini/opponent-chat`
- **Purpose**: Dynamic post-battle sportsmanship reaction from the rival trainer.
- **Input**: `{ opponentName, result: 'win' | 'loss', playerMonsterName, opponentMonsterName }`
- **Output JSON**:
  ```json
  {
    "messageFa": "مبارزه فوق‌العاده‌ای بود! استراتژی عنصری تو واقعاً غافلگیرم کرد.",
    "suggestRematch": true
  }
  ```

---

## 💾 Frontend State Management & Persistence

All primary state variables reside at the top level of `App.tsx` and are synced to `localStorage` with fail-safe JSON parsing:

| State Key | LocalStorage Key | Description |
|---|---|---|
| `monsters` | `monster_game_monsters` | List of player's owned monsters, stats, levels & evolutions |
| `activeMonsterId` | `monster_game_active_id` | Currently selected active battle monster ID |
| `playerGold` | `monster_game_gold` | Standard currency for upgrades, potions & perks |
| `playerGems` | `monster_game_gems` | Premium currency for gacha eggs & instant evolutions |
| `playerClanCoins`| `monster_game_clan_coins` | Exclusive currency earned from Clan Wars |
| `playerTrophies` | `monster_game_trophies` | Current arena trophies dictating league tier |
| `alliance` | `monster_game_alliance` | Current clan data, members, perks & war state |
| `trainer` | `monster_game_trainer` | Player name, avatar selection, and banner customization |

---

## ⚡ Elemental Combat Engine & Mathematics

The game features 6 elemental affinities with a strict rock-paper-scissors circular advantage matrix defined in `src/types.ts` (`ELEMENTAL_CHART`):

- 🔥 **Fire (آتش)**: Strong against Nature (2.0x) | Weak against Water (0.5x)
- 💧 **Water (آب)**: Strong against Fire (2.0x) | Weak against Electric (0.5x)
- 🌿 **Nature (طبیعت)**: Strong against Electric (2.0x) | Weak against Fire (0.5x)
- ⚡ **Electric (صاعقه)**: Strong against Water (2.0x) | Weak against Nature (0.5x)
- 🌑 **Shadow (سایه)**: Strong against Light (1.75x) | Takes bonus damage from Light
- ☀️ **Light (نور)**: Strong against Shadow (1.75x) | Takes bonus damage from Shadow

### Combat Damage Formula:
$$\text{Base Damage} = \text{Skill Power} \times \left(\frac{\text{Attacker Attack}}{\text{Defender Defense}}\right) \times 0.85$$
$$\text{Total Damage} = \text{Base Damage} \times \text{Elemental Multiplier} \times \text{Crit Multiplier (1.5x if triggered)}$$

---

## 🔊 Audio Engine (`src/utils/audio.ts`)

The audio engine utilizes the **Web Audio API (`AudioContext`)** to synthesize sound effects directly in the browser:
- `playHit(element)`: Frequency sweep modulated by elemental sound curves (low rumble for earth/fire, pitch slides for water/electric).
- `playCrit()`: Dual-oscillator punch with resonance distortion.
- `playVictory()` / `playDefeat()`: Polyphonic musical arpeggios.
- `playLevelUp()`: Major chord ascending chime sequence.
- `playClick()` / `playMessage()`: Lightweight, non-intrusive UI click pops.

---

## 🛡️ Error Handling & Resilience

1. **`ErrorBoundary.tsx`**:
   - Isolates runtime errors per view (Nursery, Arena, Alliance, Shop, Social).
   - Prevents unhandled exceptions from white-screening the whole application.
   - Provides a localized "تلاش مجدد و بارگذاری" (Retry & Reload) button and a safe return to home.
2. **Safe Clipboard API**:
   - `SocialChatVoice.tsx` wraps `navigator.clipboard.writeText` with an automatic `document.execCommand('copy')` fallback for sandboxed iframe compatibility.
3. **Resilient LocalStorage Hydration**:
   - Every `localStorage` read is wrapped in a `try/catch` with deep object fallback checks to handle corrupted or legacy storage formats without throwing errors.

---

## 🚀 Development, Build & Deployment Guide

### Available Scripts:
- `npm run dev`: Boots `server.ts` with `tsx` development runner on port `3000`.
- `npm run lint`: Runs `tsc --noEmit` to validate all TypeScript types and exports.
- `npm run build`: Executes `vite build` for client assets and bundles `server.ts` into a self-contained `dist/server.cjs` via `esbuild`.
- `npm start`: Runs `node dist/server.cjs` in production mode.

### Environment Variables:
Declare environment variables in `.env` (refer to `.env.example`):
```env
# Optional: Google Gemini API key for dynamic lore & AI battle tactics
GEMINI_API_KEY=
```
*Note: The application is 100% functional without an API key; all AI endpoints seamlessly fall back to rich built-in Persian tactical and lore content.*

---

## 💡 AI & Developer Extensibility Guide

When modifying or adding new features to this project:
1. **Adding New Monsters**:
   - Add new monster templates in `INITIAL_MONSTERS` inside `src/types.ts`.
   - Ensure the new species name is mapped in `MonsterRenderer.tsx` with appropriate SVG procedural paths.
2. **Adding New Skills / Elements**:
   - Update `ElementalType` enum in `src/types.ts` and ensure multipliers are updated in `ELEMENTAL_CHART`.
3. **Adding New Server Endpoints**:
   - Place all custom `/api/*` routes before the Vite middleware in `server.ts`.
   - Always implement a graceful fallback in case `GEMINI_API_KEY` is undefined.
4. **Localization**:
   - All player-facing UI strings must be in clear, natural Persian with appropriate RTL layout formatting (`font-sans`, `dir="rtl"`).

---
*Created for Google AI Studio Build.*
