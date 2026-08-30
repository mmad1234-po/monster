import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, DailyReward, Achievement, Monster, TrainerCustomization } from '../types';
import { DAILY_REWARDS, INITIAL_ACHIEVEMENTS } from '../data/gameData';
import { MonsterRenderer } from './MonsterRenderer';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  MessageSquare, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Users, 
  Share2, 
  Gift, 
  Award, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink,
  Flame,
  UserPlus,
  Zap,
  Crown,
  ShieldAlert
} from 'lucide-react';

interface SocialChatVoiceProps {
  playerGold: number;
  playerGems: number;
  onAddRewards: (gold: number, gems: number) => void;
  activeMonster: Monster;
  trainer: TrainerCustomization;
  playerTrophies: number;
}

export const SocialChatVoice: React.FC<SocialChatVoiceProps> = ({
  playerGold,
  playerGems,
  onAddRewards,
  activeMonster,
  trainer,
  playerTrophies,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'party' | 'daily' | 'achievements' | 'share'>('chat');
  const [chatChannel, setChatChannel] = useState<'global' | 'alliance' | 'party'>('global');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      channel: 'global',
      senderId: 'u1',
      senderName: 'کوروش جهان‌گشا',
      senderTag: 'PHNX',
      avatar: 'avatar_dragon_knight',
      message: 'سلام به تمام مربیان دنیای هیولاها! برای مسابقات پایان فصل آماده‌اید؟',
      timestamp: '۱۰:۲۴',
      badge: 'گرندمستر',
    },
    {
      id: 'm2',
      channel: 'global',
      senderId: 'u2',
      senderName: 'سایه‌شکار آرنا',
      senderTag: 'VOID',
      avatar: 'avatar_ninja_assassin',
      message: 'تخم‌های میتیک فروشگاه درصد دراپ فوق‌العاده‌ای دارن، من یک اژدهای خلاء گرفتم!',
      timestamp: '۱۰:۲۶',
    },
    {
      id: 'm3',
      channel: 'alliance',
      senderId: 'u3',
      senderName: 'آرشام اژدهاکش',
      senderTag: 'PHNX',
      avatar: 'avatar_dragon_knight',
      message: 'بچه‌ها همه به پایگاه شماره ۲ حریف در جنگ اتحاد اتک بزنید تا ۳ ستاره بشیم.',
      timestamp: '۱۰:۲۹',
      badge: 'رهبر اتحاد',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  
  // Voice Chat State & Real Microphone Analyser
  const [isMicOn, setIsMicOn] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [speakingUsers, setSpeakingUsers] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Daily Rewards
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>(DAILY_REWARDS);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  // Party Room
  const [partyCode, setPartyCode] = useState('REALM-7749');
  const [partyMembers, setPartyMembers] = useState([
    { name: trainer.name, isHost: true, isReady: true, avatar: '👑' },
    { name: 'آرشام اژدهاکش', isHost: false, isReady: true, avatar: '⚔️' },
    { name: 'در انتظار مربی...', isHost: false, isReady: false, avatar: '⏳' },
  ]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Toggle Voice Microphones with Web Audio Analyser
  const toggleMicrophone = async () => {
    if (!isMicOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        setIsMicOn(true);
        sounds.playClick();

        const updateVolume = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolume(avg);

          animFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();

      } catch (err) {
        console.warn('Microphone permission or hardware unavailable; running voice simulation mode.', err);
        setIsMicOn(true);
        sounds.playClick();
        
        const interval = setInterval(() => {
          setMicVolume(Math.floor(Math.random() * 60) + 20);
        }, 150);
        (window as any).__voiceSimInterval = interval;
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if ((window as any).__voiceSimInterval) {
        clearInterval((window as any).__voiceSimInterval);
      }
      setIsMicOn(false);
      setMicVolume(0);
      sounds.playClick();
    }
  };

  // Simulating teammate audio activity
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isDeafened) {
        if (Math.random() > 0.6) {
          setSpeakingUsers(['آرشام اژدهاکش']);
        } else if (Math.random() > 0.8) {
          setSpeakingUsers(['سهراب طوفان']);
        } else {
          setSpeakingUsers([]);
        }
      } else {
        setSpeakingUsers([]);
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isDeafened]);

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sounds.playMessage();
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      channel: chatChannel,
      senderId: 'usr_me',
      senderName: trainer.name,
      senderTag: 'PHNX',
      avatar: trainer.avatarId || 'avatar_shadow_hunter',
      message: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      badge: 'شما',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
  };

  // Quick Strategy Ping
  const handleQuickPing = (pingText: string) => {
    sounds.playRadioPing();
    const newMsg: ChatMessage = {
      id: `ping_${Date.now()}`,
      channel: chatChannel,
      senderId: 'usr_me',
      senderName: trainer.name,
      senderTag: 'PHNX',
      avatar: trainer.avatarId || 'avatar_shadow_hunter',
      message: `⚡ [پینگ تاکتیکی]: ${pingText}`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      badge: 'تاکتیک',
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Claim Daily Reward
  const handleClaimDaily = (day: number) => {
    const target = dailyRewards.find((r) => r.day === day);
    if (!target || target.claimed) return;

    sounds.playVictory();
    confetti({ particleCount: 100, spread: 70 });
    onAddRewards(target.gold, target.gems);

    setDailyRewards((prev) =>
      prev.map((r) => (r.day === day ? { ...r, claimed: true } : r))
    );

    alert(`🎉 جایزه روز ${day} دریافت شد: ${target.gold} طلا و ${target.gems} الماس!`);
  };

  // Claim Achievement Reward
  const handleClaimAchievement = (achId: string) => {
    const ach = achievements.find((a) => a.id === achId);
    if (!ach || !ach.completed) return;

    sounds.playVictory();
    confetti({ particleCount: 90, spread: 60 });
    onAddRewards(0, ach.rewardGems);

    setAchievements((prev) =>
      prev.map((a) => (a.id === achId ? { ...a, progress: a.maxProgress, completed: true } : a))
    );

    alert(`🏆 پاداش دستاورد [${ach.titleFa}] به مقدار ${ach.rewardGems} الماس دریافت شد!`);
  };

  // Clean up audio streams and intervals on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if ((window as any).__voiceSimInterval) {
        clearInterval((window as any).__voiceSimInterval);
      }
    };
  }, []);

  // Safe clipboard helper function
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Ignore clipboard permission issues in sandboxed iframes
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  };

  const handleCopyPartyCode = () => {
    copyToClipboard(partyCode);
    setCopiedCode(true);
    sounds.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareLink = () => {
    const shareText = `🔥 در بازی دنیای هیولاها به گروه من با کد ${partyCode} ملحق شو! هیولای من: ${activeMonster.nameFa} با ${playerTrophies} کاپ`;
    copyToClipboard(shareText);
    setCopiedShareLink(true);
    sounds.playClick();
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Social Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'chat', label: 'چت متنی و صوتی زنده', icon: MessageSquare },
          { id: 'party', label: 'لابی گروهی و دعوت دوستان', icon: Users },
          { id: 'daily', label: 'جوایز روزانه ورود (۷ روز)', icon: Gift },
          { id: 'achievements', label: 'دستاوردها و نشان‌ها', icon: Award },
          { id: 'share', label: 'اشتراک‌گذاری در شبکه‌های اجتماعی', icon: Share2 },
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
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE TEXT & VOICE CHAT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chat Stream (8 cols) */}
          <div className="lg:col-span-8 bg-white/95 border border-slate-200/90 rounded-3xl p-5 flex flex-col justify-between min-h-[520px] shadow-md">
            {/* Channel Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'global', label: '🌐 چت جهانی' },
                  { id: 'alliance', label: '🛡️ چت اتحاد [PHNX]' },
                  { id: 'party', label: '⚔️ چت گروه نبرد' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      sounds.playClick();
                      setChatChannel(c.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${
                      chatChannel === c.id
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> سرور آنلاین
              </span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[320px]">
              {messages
                .filter((m) => m.channel === chatChannel || chatChannel === 'global')
                .map((msg) => {
                  const isMe = msg.senderId === 'usr_me';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 border border-amber-300 flex items-center justify-center font-black text-xs text-slate-950 flex-shrink-0 shadow-xs">
                        {msg.senderName.charAt(0)}
                      </div>
                      <div
                        className={`max-w-[78%] p-3.5 rounded-2xl text-xs space-y-1 ${
                          isMe
                            ? 'bg-amber-50 border border-amber-300/80 text-slate-900 shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                          <span className="font-black text-amber-800 flex items-center gap-1">
                            {msg.senderTag ? `[${msg.senderTag}] ` : ''}{msg.senderName}
                            {msg.badge && (
                              <span className="bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-black text-[9px]">
                                {msg.badge}
                              </span>
                            )}
                          </span>
                          <span className="font-mono">{msg.timestamp}</span>
                        </div>
                        <p className="leading-relaxed font-semibold">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Quick Strategy Tactical Pings */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-200 mt-2">
              <span className="text-[10px] font-black text-slate-500 flex-shrink-0">پینگ تاکتیکی:</span>
              {[
                'حمله همگانی به باس! 🔥',
                'آماده نبرد رید هستم ⚔️',
                'سپر دفاعی فعال شد 🛡️',
                'به قلعه اتحاد کمک کنید!',
              ].map((ping) => (
                <button
                  key={ping}
                  onClick={() => handleQuickPing(ping)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 whitespace-nowrap transition-colors"
                >
                  {ping}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 bg-white border border-slate-300 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl transition-transform active:scale-95 flex items-center gap-1.5 text-xs shadow-md shadow-amber-500/20"
              >
                <Send className="w-3.5 h-3.5" /> ارسال
              </button>
            </form>
          </div>

          {/* Voice Chat Control Room (4 cols) */}
          <div className="lg:col-span-4 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-xl text-white">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                  اتاق گفتگوی صوتی زنده
                </h3>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                  isMicOn ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isMicOn ? 'میکروفون فعال' : 'خاموش'}
                </span>
              </div>
              <p className="text-xs text-slate-400">مکالمه صوتی همزمان در ریدها و جنگ اتحادها با شبیه‌ساز فرکانس صوتی.</p>

              {/* Active Voice Speakers */}
              <div className="mt-4 space-y-2.5">
                {/* Me */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isMicOn && micVolume > 10
                    ? 'bg-emerald-950/60 border-emerald-400/80 shadow-emerald-500/20'
                    : 'bg-slate-800/80 border-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                      شما
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{trainer.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{isMicOn ? 'در حال صحبت' : 'میکروفون قطع'}</p>
                    </div>
                  </div>
                  {isMicOn && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 bg-emerald-400 rounded animate-bounce" style={{ height: `${Math.max(6, micVolume * 0.25)}px` }} />
                      <div className="w-1 bg-emerald-400 rounded animate-bounce" style={{ height: `${Math.max(10, micVolume * 0.35)}px`, animationDelay: '0.1s' }} />
                      <div className="w-1 bg-emerald-400 rounded animate-bounce" style={{ height: `${Math.max(6, micVolume * 0.2)}px`, animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>

                {/* Teammates */}
                {['آرشام اژدهاکش', 'سهراب طوفان'].map((name) => {
                  const isSpeaking = speakingUsers.includes(name);
                  return (
                    <div
                      key={name}
                      className={`p-3 rounded-2xl border flex items-center justify-between ${
                        isSpeaking
                          ? 'bg-cyan-950/60 border-cyan-400/80 shadow-cyan-500/20'
                          : 'bg-slate-800/80 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-slate-200">
                          {name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">{name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{isSpeaking ? '🎙️ در حال صحبت...' : 'گوش می‌دهد'}</p>
                        </div>
                      </div>
                      {isSpeaking && (
                        <div className="flex items-center gap-0.5">
                          <div className="w-1 h-3 bg-cyan-400 rounded animate-bounce" />
                          <div className="w-1 h-5 bg-cyan-400 rounded animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1 h-2 bg-cyan-400 rounded animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voice Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-700/80">
              <button
                onClick={toggleMicrophone}
                className={`w-full py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md ${
                  isMicOn
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isMicOn ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMicOn ? 'قطع میکروفون (Mute)' : 'روشن کردن میکروفون'}
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setIsDeafened(!isDeafened);
                }}
                className={`w-full py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  isDeafened
                    ? 'bg-slate-800 text-rose-400 border-rose-500/50'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isDeafened ? 'صدای اتاق قطع است' : 'قطع صدای سایرین (Deafen)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTY ROOM & FRIEND INVITES */}
      {activeTab === 'party' && (
        <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                لابی گروهی و دعوت دوستان به نبردهای تیمی
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">کد دعوت را برای دوستان خود بفرستید تا در ریدهای چندنفره به شما ملحق شوند.</p>
            </div>

            {/* Invite Code Box */}
            <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-2xl border border-amber-300">
              <span className="text-xs font-bold text-slate-600 pl-2">کد لابی:</span>
              <span className="text-sm font-mono font-black text-amber-800">{partyCode}</span>
              <button
                onClick={handleCopyPartyCode}
                className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-transform active:scale-95 shadow-xs"
                title="کپی کد دعوت"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Party Members Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {partyMembers.map((member, i) => (
              <div
                key={i}
                className="bg-slate-50 border border-slate-200 p-5 rounded-3xl flex flex-col items-center justify-between text-center space-y-3 shadow-xs"
              >
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-xs">
                  {member.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{member.name}</h4>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">{member.isHost ? 'میزبان گروه' : 'عضو تیم'}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${
                  member.isReady ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {member.isReady ? 'آماده نبرد ✓' : 'در انتظار...'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                sounds.playVictory();
                alert('⚡ نبرد گروهی رید آغاز شد!');
              }}
              className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition-transform active:scale-95"
            >
              شروع نبرد تیمی با گروه (Launch Co-op Battle)
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DAILY REWARDS (7 DAYS) */}
      {activeTab === 'daily' && (
        <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-md">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              تقویم جوایز روزانه ورود به بازی
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">هر روز وارد شوید و جوایز تصاعدی طلا، الماس و تخم‌های باستانی دریافت کنید.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {dailyRewards.map((reward) => (
              <div
                key={reward.day}
                className={`p-4 rounded-3xl border flex flex-col justify-between items-center text-center space-y-3 shadow-xs ${
                  reward.claimed
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : reward.day === 3
                    ? 'bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400 shadow-md shadow-amber-500/15'
                    : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-xs font-black text-slate-500">روز {reward.day}</span>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-800">+{reward.gold.toLocaleString()} 🪙</p>
                  <p className="text-[11px] font-black text-cyan-700">+{reward.gems} 💎</p>
                  {reward.itemFa && <p className="text-[10px] font-bold text-slate-500 mt-1">{reward.itemFa}</p>}
                </div>

                <button
                  onClick={() => handleClaimDaily(reward.day)}
                  disabled={reward.claimed || reward.day > 3}
                  className={`w-full py-1.5 rounded-xl text-xs font-black transition-colors ${
                    reward.claimed
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : reward.day === 3
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {reward.claimed ? 'دریافت شد ✓' : reward.day === 3 ? 'دریافت جایزه' : 'روزهای بعد'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-md">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            دستاوردها و افتخارات ثبت‌شده
          </h3>

          <div className="space-y-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{ach.titleFa}</h4>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">{ach.descFa}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono font-bold">{ach.progress}/{ach.maxProgress}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleClaimAchievement(ach.id)}
                  disabled={!ach.completed}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-transform active:scale-95 ${
                    ach.completed
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  +{ach.rewardGems} 💎 دریافت
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SOCIAL SHARE BRAG CARD */}
      {activeTab === 'share' && (
        <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-md">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-amber-600" />
              کارت افتخارات و اشتراک‌گذاری در شبکه‌های اجتماعی
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">پیشرفت‌ها و هیولای نیرومند خود را با دوستانتان در تلگرام، واتس‌اپ و ایکس به اشتراک بگذارید.</p>
          </div>

          {/* Brag Card Preview */}
          <div className="max-w-md mx-auto bg-gradient-to-b from-amber-50/80 via-white to-sky-50/70 border-2 border-amber-400 p-6 rounded-3xl text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-amber-800">[PHNX] {trainer.name}</span>
              <span className="text-slate-600 font-mono font-bold">{playerTrophies} 🏆 کاپ</span>
            </div>

            <div className="my-2 flex justify-center">
              <MonsterRenderer monster={activeMonster} size="lg" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900">{activeMonster.nameFa}</h4>
              <p className="text-xs font-extrabold text-amber-700 mt-0.5">سطح {activeMonster.level} • تکامل مرحله {activeMonster.evolutionStage}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-200 text-xs shadow-xs">
              <div>
                <p className="text-slate-500 font-bold">قدرت حمله</p>
                <p className="font-black text-red-600">{activeMonster.attack}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold">دفاع</p>
                <p className="font-black text-emerald-600">{activeMonster.defense}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold">سرعت</p>
                <p className="font-black text-amber-600">{activeMonster.speed}</p>
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="max-w-md mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => {
                const text = encodeURIComponent(`🔥 هیولای من [${activeMonster.nameFa}] با ${playerTrophies} جام در بازی هیولاها آماده نبرد است!`);
                window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
              }}
              className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1 transition-transform active:scale-95 shadow-xs"
            >
              تلگرام ✈️
            </button>
            <button
              onClick={() => {
                const text = encodeURIComponent(`🔥 هیولای من [${activeMonster.nameFa}] با ${playerTrophies} جام در بازی هیولاها آماده نبرد است!`);
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              }}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1 transition-transform active:scale-95 shadow-xs"
            >
              واتس‌اپ 💬
            </button>
            <button
              onClick={() => {
                const text = encodeURIComponent(`🔥 هیولای من [${activeMonster.nameFa}] با ${playerTrophies} جام در بازی هیولاها آماده نبرد است!`);
                window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
              }}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1 transition-transform active:scale-95 shadow-xs"
            >
              ایکس 🐦
            </button>
            <button
              onClick={handleCopyShareLink}
              className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1 transition-transform active:scale-95 shadow-xs"
            >
              {copiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedShareLink ? 'کپی شد' : 'کپی متن'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
