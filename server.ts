import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client to avoid crashes if API key is not yet set
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. AI Battle Strategist (Tactical Coach)
app.post('/api/gemini/tactics', async (req, res) => {
  try {
    const { playerMonster, enemyMonster, playerHp, enemyHp, turnCount } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        tacticalTip: `عنصر ${playerMonster?.element || 'آتش'} در برابر حرکات حریف قدرت بالایی دارد. با حفظ انرژی، مهارت‌های سنگین را در نوبت‌های حیاتی پیاده کنید.`,
        recommendedSkillType: 'attack',
        winProbabilityPercent: 76,
        battleCry: 'طوفان عناصر در دستان توست!',
      });
    }

    const ai = getGeminiClient();
    const prompt = `You are the Master Battle Tactician in the Persian fantasy RPG game "Monster Realm: Arena of Alliances" (دنیای هیولاها).
Current battle state:
- Player Monster: ${playerMonster?.nameFa || playerMonster?.name} (${playerMonster?.element}, HP: ${playerHp}/${playerMonster?.maxHp || 400}, Level ${playerMonster?.level || 1})
- Enemy Monster: ${enemyMonster?.nameFa || enemyMonster?.name} (${enemyMonster?.element}, HP: ${enemyHp}/${enemyMonster?.maxHp || 400}, Level ${enemyMonster?.level || 1})
- Turn: ${turnCount || 1}

Analyze the elemental strengths, current HP status, and recommend:
1. Best tactical action/skill to prioritize
2. Key danger to watch out for
3. A short, inspiring battle war-cry in Persian.

Provide your response in JSON format with keys: "tacticalTip" (string in Persian, 2-3 sentences), "recommendedSkillType" (string: attack/buff/ultimate/heal), "winProbabilityPercent" (number 1-99), "battleCry" (string in Persian).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        tacticalTip: 'از برتری عنصری استفاده کنید و مهارت‌های قدرتی را پس از تضعیف دفاع دشمن فعال نمایید.',
        recommendedSkillType: 'attack',
        winProbabilityPercent: 78,
        battleCry: 'به پیش ای قهرمان آرنا!',
      };
    }
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Fallback in /api/gemini/tactics:', error?.message || error);
    return res.json({
      tacticalTip: 'تمرکز بر ترکیب مهارت‌های تهاجمی و حفظ انرژی برای اجرای فن نهایی (آلتیمیت) در نوبت مناسب.',
      recommendedSkillType: 'attack',
      winProbabilityPercent: 70,
      battleCry: 'طوفان عناصر در دستان توست!',
    });
  }
});

// 2. AI Monster Lore & Origin Generator
app.post('/api/gemini/monster-lore', async (req, res) => {
  try {
    const raw = req.body || {};
    const monster = raw.monster || raw;
    const nameFa = monster.nameFa || monster.name || 'هیولای اساطیری';
    const element = monster.element || 'fire';
    const speciesFa = monster.speciesFa || monster.species || 'گونه باستانی';
    const level = monster.level || 1;
    const evolutionStage = monster.evolutionStage || 1;
    const maxEvolutionStage = monster.maxEvolutionStage || 3;
    const rarity = monster.rarity || 'epic';

    const ai = getGeminiClient();

    const prompt = `Write an epic mythological backstory and title in Persian for a fantasy monster with the following attributes:
- Name: ${nameFa}
- Element: ${element}
- Species: ${speciesFa}
- Level: ${level}
- Evolution Stage: ${evolutionStage} / ${maxEvolutionStage}
- Rarity: ${rarity}

Format the response in JSON with keys:
"loreTitleFa" (e.g. نگهبان شعله‌های جاویدان),
"loreBackstoryFa" (2-3 rich paragraphs in Persian describing its birth in the elemental realm and its legendary deeds),
"loreSummonChantFa" (a short epic summoning chant in Persian),
"loreHiddenTraitFa" (one special unique passive trait description in Persian).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    const result = {
      loreTitleFa: parsed.loreTitleFa || parsed.titleFa || 'فرمانروای افسانه‌ای قلمرو عناصر',
      loreBackstoryFa: parsed.loreBackstoryFa || parsed.backstoryFa || 'این هیولا در اعماق قلب طبیعت و از گدازه‌های کهن متولد شده است و با هر نبرد قدرت اصیل خود را بازمی‌یابد.',
      loreSummonChantFa: parsed.loreSummonChantFa || parsed.signatureChantFa || 'از دل آتش و صاعقه برخیز و تاریکی را بسوزان!',
      loreHiddenTraitFa: parsed.loreHiddenTraitFa || parsed.hiddenPowerFa || 'افزایش ۱۵ درصدی شانس ضربه بحرانی هنگام کاهش سلامت به زیر ۳۰ درصد.',
      titleFa: parsed.loreTitleFa || parsed.titleFa || 'فرمانروای افسانه‌ای قلمرو عناصر',
      backstoryFa: parsed.loreBackstoryFa || parsed.backstoryFa || 'این هیولا در اعماق قلب طبیعت و از گدازه‌های کهن متولد شده است.',
      signatureChantFa: parsed.loreSummonChantFa || parsed.signatureChantFa || 'از دل عناصر برخیز!',
      hiddenPowerFa: parsed.loreHiddenTraitFa || parsed.hiddenPowerFa || 'افزایش قدرت در نبرد.',
    };

    return res.json(result);
  } catch (error: any) {
    console.warn('Fallback in /api/gemini/monster-lore:', error?.message || error);
    return res.json({
      loreTitleFa: 'فرمانروای بیدارشده عناصر باستانی',
      loreBackstoryFa: 'زاده شده در دل طوفان‌های ابدی و صخره‌های کریستالی، این هیولای افسانه‌ای حامل قدرت کهن نیاکان است.',
      loreSummonChantFa: 'نیروی بی‌پایان کهکشان، در هیبت این قهرمان تجلی می‌یابد!',
      loreHiddenTraitFa: 'بازسازی ۵ درصدی انرژی در ابتدای هر دور مبارزه.',
      titleFa: 'فرمانروای بیدارشده عناصر باستانی',
      backstoryFa: 'زاده شده در دل طوفان‌های ابدی و صخره‌های کریستالی، این هیولای افسانه‌ای حامل قدرت کهن نیاکان است.',
      signatureChantFa: 'نیروی بی‌پایان کهکشان، در هیبت این قهرمان تجلی می‌یابد!',
      hiddenPowerFa: 'بازسازی ۵ درصدی انرژی در ابتدای هر دور مبارزه.',
    });
  }
});

// 3. AI Opponent Banter & Post-Battle Reactions
app.post('/api/gemini/opponent-chat', async (req, res) => {
  try {
    const { opponentName, result, playerMonsterName, opponentMonsterName } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        messageFa: result === 'win' 
          ? 'مبارزه فوق‌العاده‌ای بود! استراتژی عنصری تو واقعاً غافلگیرم کرد. دفعه بعد آماده‌تر میام!'
          : 'بازی خوبی بود! هیولای قدرتمندی داری، نبرد خیلی نفس‌گیر شد. ممنون از رقابت!',
        suggestRematch: true,
      });
    }

    const ai = getGeminiClient();

    const prompt = `You are the PvP opponent "${opponentName || 'حریف'}" in the Persian RPG game "Monster Realm".
The match just ended. Result for player: ${result} (meaning opponent ${result === 'win' ? 'lost' : 'won'}).
Player monster: ${playerMonsterName || 'هیولای بازیکن'}, Opponent monster: ${opponentMonsterName || 'هیولای حریف'}.

Generate a sportsmanship post-battle message in Persian (friendly, competitive, respectful or witty).
Return JSON with key "messageFa" (string) and "suggestRematch" (boolean).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        messageFa: result === 'win' 
          ? 'مبارزه فوق‌العاده‌ای بود! استراتژی عنصری تو واقعاً غافلگیرم کرد. دفعه بعد آماده‌تر میام!'
          : 'بازی خوبی بود! هیولای قدرتمندی داری، نبرد خیلی نفس‌گیر شد. ممنون از رقابت!',
        suggestRematch: true,
      };
    }
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Fallback in /api/gemini/opponent-chat:', error?.message || error);
    return res.json({
      messageFa: req.body?.result === 'win' 
        ? 'عجب کامبک شگفت‌انگیزی زدی! تبریک بابت پیروزی درخشانت در آرنا.' 
        : 'نبرد بسیار پایاپای و هیجان‌انگیزی بود، حتماً باز هم با هم مسابقه بدیم!',
      suggestRematch: true,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Monster Realm Game Server running on port ${PORT}`);
  });
}

startServer();
