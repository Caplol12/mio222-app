import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Settings, Key, Trash2, CheckCircle2, Cpu, Crown } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';

import { Bookmark, CategoryItem } from '../types';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  categories: CategoryItem[];
  onOrganizeBookmarks?: (organizedData: { categories: string[]; assignments: Record<string, string[]> }) => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const AVAILABLE_MODELS = [
  // Gemini Models (Free / Standard)
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'سریع و بهینه‌شده (پیش‌فرض)', provider: 'gemini', isPremium: false },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'پاسخ‌دهی پیشرفته و دقیق', provider: 'gemini', isPremium: false },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'سرعت فوق‌العاده بالا', provider: 'gemini', isPremium: false },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'پشتیبانی متن‌های طولانی', provider: 'gemini', isPremium: false },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'سبک و اقتصادی', provider: 'gemini', isPremium: false },

  // NVIDIA Premium Models
  { id: 'z-ai/glm-5.2', name: 'GLM 5.2', desc: 'مدل قدرتمند NVIDIA (پرمیوم 👑)', provider: 'nvidia', isPremium: true },
  { id: 'minimax/minimax-3', name: 'Minimax 3', desc: 'پردازش فوق هوشمند NVIDIA (پرمیوم 👑)', provider: 'nvidia', isPremium: true },
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash', desc: 'مدل فست DeepSeek v4 (پرمیوم 👑)', provider: 'nvidia', isPremium: true },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro', desc: 'نسخه پرو DeepSeek v4 (پرمیوم 👑)', provider: 'nvidia', isPremium: true },
  { id: 'minimax/minimax-2.7', name: 'Minimax 2.7', desc: 'مدل استدلال Minimax 2.7 (پرمیوم 👑)', provider: 'nvidia', isPremium: true },
  { id: 'mistralai/mistral-128b', name: 'Mistral 128B', desc: 'مدل سنگین 128B میاسترال (پرمیوم 👑)', provider: 'nvidia', isPremium: true },
];

const NVIDIA_DEV_KEY = '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';

export default function AIChatPanel({ isOpen, onClose, bookmarks, categories, onOrganizeBookmarks }: AIChatPanelProps) {
  const { getGlassStyle } = useGlassStyle();
  const { user } = useAuth();

  // Check if current user has Premium privileges (isPremium flag, admin, or stored user)
  const isUserPremium = Boolean(
    user?.isPremium || 
    (user?.email && isAdmin(user.email)) ||
    (() => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.isPremium || (parsed.email && isAdmin(parsed.email));
        }
      } catch {}
      return false;
    })()
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem('ai_chat_history');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [{ role: 'model', content: 'سلام! چطور می‌تونم بهتون کمک کنم؟' }];
  });

  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Model selection state with local persistence
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const storedModel = localStorage.getItem('selected_ai_model');
      if (storedModel) return storedModel;
    } catch {}
    try {
      const storedAdmin = localStorage.getItem('admin_settings');
      if (storedAdmin) {
        const parsed = JSON.parse(storedAdmin);
        if (parsed?.defaultAiModel) return parsed.defaultAiModel;
      }
    } catch {}
    return 'gemini-2.5-flash';
  });

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    localStorage.setItem('selected_ai_model', newModel);
  };

  // User's personal API key(s) with local persistence
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('user_gemini_api_key') || '';
    } catch { return ''; }
  });

  const [savedKeys, setSavedKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('user_gemini_api_keys');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const single = localStorage.getItem('user_gemini_api_key');
      if (single) return [single];
    } catch {}
    return [];
  });

  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleSaveApiKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;

    setUserApiKey(trimmed);
    localStorage.setItem('user_gemini_api_key', trimmed);

    const updatedKeys = Array.from(new Set([trimmed, ...savedKeys]));
    setSavedKeys(updatedKeys);
    localStorage.setItem('user_gemini_api_keys', JSON.stringify(updatedKeys));

    setKeyInput('');
    setSaveSuccessMsg('کلید API با موفقیت و به صورت لوکال در مرورگر شما ذخیره شد.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleSelectKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('user_gemini_api_key', key);
    setSaveSuccessMsg('کلید فعال تغییر یافت.');
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleRemoveKey = (keyToRemove: string) => {
    const updated = savedKeys.filter(k => k !== keyToRemove);
    setSavedKeys(updated);
    localStorage.setItem('user_gemini_api_keys', JSON.stringify(updated));
    if (userApiKey === keyToRemove) {
      const nextKey = updated[0] || '';
      setUserApiKey(nextKey);
      localStorage.setItem('user_gemini_api_key', nextKey);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const callGeminiApi = async (userMessage: string, history: Message[]): Promise<string> => {
    const currentKey = localStorage.getItem('user_gemini_api_key') || userApiKey;
    
    if (!currentKey.trim()) {
      throw new Error('لطفاً ابتدا کلید API شخصی Gemini خود را از بخش تنظیمات ⚙️ وارد کنید.');
    }

    const systemPrompt = `شما دستیار هوشمند مدیر نشانک‌ها (Bookmarks Manager) هستید. شما به پایگاه داده نشانک‌ها و دسته‌بندی‌های کاربر دسترسی دارید.

قوانین و مراحل مرتب‌سازی هوشمند نشانک‌ها:
۱. اگر کاربر اولین بار گفت "نشانک‌ها را مرتب کن" یا روی دستور مرتب‌سازی کلیک کرد، اما هنوز **استایل و معیار دسته‌بندی** (مثل استاندارد، ریز‌موضوعات، خلاقانه، طنز، بر اساس کاربرد یا زبان) را مشخص نکرده است:
   - نباید هنوز JSON تولید کنی!
   - از کاربر بصورت صمیمی و شفاف بپرس که ترجیح می‌دهد نشانک‌ها با چه استایل و معیاری (مثلاً: استاندارد، ریز‌موضوعات تخصصی، خلاقانه/طنز، یا استایل دلخواه خودش) در پوشه‌ها دسته‌بندی شوند.

۲. اگر کاربر استایل را مشخص کرد (یا در پیام خود استایل و نحوه مرتب‌سازی را ذکر نمود):
   - تمام نشانک‌ها را تحلیل کن و دقیقا بر اساس همان استایل خواسته شده، دسته‌بندی‌ها (پوشه‌ها) را بساز.
   - حتماً خروجی خود را دقیقاً با این فرمت JSON در انتهای پاسخ قرار بده تا سیستم بتواند آن را در صفحه ai list اجرا کند:

\`\`\`json
{
  "action": "organize_ai_list",
  "categories": ["نام پوشه ۱", "نام پوشه ۲", ...],
  "assignments": {
    "نام پوشه ۱": ["id_bookmark_1", "id_bookmark_2"],
    "نام پوشه ۲": ["id_bookmark_3"]
  }
}
\`\`\`

اطلاعات فعلی:
دسته بندی ها: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })))}
نشانک ها: ${JSON.stringify(bookmarks.map(b => ({ id: b.id, title: b.title, domain: b.domain, description: b.description, tags: b.tags })))}`;

    const contents = [...history, { role: 'user', content: userMessage }].map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    const requestBody = {
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }]
      },
      contents
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const modelToUse = selectedModel || 'gemini-2.5-flash';

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${currentKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 400) throw new Error('کلید API نامعتبر است یا مدل انتخابی پشتیبانی نمی‌شود.');
        if (response.status === 403) throw new Error('دسترسی رد شد. کلید API شما معتبر نیست یا منقضی شده.');
        if (response.status === 429) throw new Error('محدودیت درخواست (Rate Limit). لطفاً کمی صبر کنید.');
        throw new Error(`خطای سرور گوگل (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('پاسخ نامعتبر از سرور گوگل دریافت شد.');
      }

      return text;

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('زمان انتظار تمام شد. لطفاً دوباره امتحان کنید.');
      }
      throw error;
    }
  };

  const callNvidiaApi = async (userMessage: string, history: Message[], modelToUse: string): Promise<string> => {
    const systemPrompt = `شما دستیار هوشمند مدیر نشانک‌ها (Bookmarks Manager) هستید. شما به پایگاه داده نشانک‌ها و دسته‌بندی‌های کاربر دسترسی دارید.

قوانین و مراحل مرتب‌سازی هوشمند نشانک‌ها:
۱. اگر کاربر اولین بار گفت "نشانک‌ها را مرتب کن" یا روی دستور مرتب‌سازی کلیک کرد، اما هنوز **استایل و معیار دسته‌بندی** (مثل استاندارد، ریز‌موضوعات، خلاقانه، طنز، بر اساس کاربرد یا زبان) را مشخص نکرده است:
   - نباید هنوز JSON تولید کنی!
   - از کاربر بصورت صمیمی و شفاف بپرس که ترجیح می‌دهد نشانک‌ها با چه استایل و معیاری در پوشه‌ها دسته‌بندی شوند.

۲. اگر کاربر استایل را مشخص کرد (یا در پیام خود استایل و نحوه مرتب‌سازی را ذکر نمود):
   - تمام نشانک‌ها را تحلیل کن و دقیقا بر اساس همان استایل خواسته شده، دسته‌بندی‌ها (پوشه‌ها) را بساز.
   - حتماً خروجی خود را دقیقاً با این فرمت JSON در انتهای پاسخ قرار بده تا سیستم بتواند آن را در صفحه ai list اجرا کند:

\`\`\`json
{
  "action": "organize_ai_list",
  "categories": ["نام پوشه ۱", "نام پوشه ۲", ...],
  "assignments": {
    "نام پوشه ۱": ["id_bookmark_1", "id_bookmark_2"],
    "نام پوشه ۲": ["id_bookmark_3"]
  }
}
\`\`\`

اطلاعات فعلی:
دسته بندی ها: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })))}
نشانک ها: ${JSON.stringify(bookmarks.map(b => ({ id: b.id, title: b.title, domain: b.domain, description: b.description, tags: b.tags })))}`;

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: userMessage }
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NVIDIA_DEV_KEY}`
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: openAiMessages,
          temperature: 0.7,
          top_p: 1,
          max_tokens: 2048
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) throw new Error('کلید سرور NVIDIA نامعتبر است.');
        if (response.status === 429) throw new Error('محدودیت درخواست سرور NVIDIA. لطفاً لحظاتی بعد امتحان کنید.');
        throw new Error(`خطای سرور انویدیا (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('پاسخی از سرور NVIDIA دریافت نشد.');

      return text;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('زمان انتظار سرور NVIDIA تمام شد.');
      }
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const selectedModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModel);
    const isNvidiaModel = selectedModelObj?.provider === 'nvidia';

    // Check Premium requirement for NVIDIA Models
    if (isNvidiaModel && !isUserPremium) {
      setMessages(prev => [...prev, { role: 'model', content: '👑 **دسترسی به مدل‌های NVIDIA ویژه کاربران پرمیوم است!**\n\nبرای استفاده از این مدل‌ها و تمامی امکانات پیشرفته، لطفاً اکانت خود را به **پرمیوم** ارتقا دهید.' }]);
      setShowSettings(true);
      return;
    }

    // Check Gemini API key requirement for Gemini models
    if (!isNvidiaModel && !userApiKey) {
      setMessages(prev => [...prev, { role: 'model', content: 'لطفاً ابتدا از بخش تنظیمات ⚙️ کلید API شخصی Gemini خود را وارد و ذخیره کنید.' }]);
      setShowSettings(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    const currentHistory = messages.filter(m => !m.content.includes('خطایی رخ داد') && !m.content.includes('لطفاً ابتدا از بخش تنظیمات'));
    
    setMessages([...currentHistory, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      let reply = '';
      if (isNvidiaModel) {
        reply = await callNvidiaApi(userMessage, currentHistory, selectedModel);
      } else {
        reply = await callGeminiApi(userMessage, currentHistory);
      }

      setMessages(prev => [...prev, { role: 'model', content: reply }]);

      // Check if response contains JSON action for organize
      const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.action === 'organize_ai_list' && parsed.categories && parsed.assignments) {
            onOrganizeBookmarks?.({
              categories: parsed.categories,
              assignments: parsed.assignments
            });
          }
        } catch (e) {
          console.error("Error parsing JSON action from AI response", e);
        }
      }
    } catch (error: any) {
      console.error('Error generating response:', error);
      const errorMsg = error.message || 'خطای ناشناخته‌ای رخ داد.';
      setMessages(prev => [...prev, { role: 'model', content: `خطا: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentModelName = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel;

  return (
    <div 
      style={getGlassStyle()} 
      className="fixed right-6 sm:right-24 top-16 sm:top-24 bottom-16 sm:bottom-24 w-[90vw] sm:w-[380px] z-50 rounded-[24px] shadow-2xl border border-white/40 dark:border-white/10 flex flex-col overflow-hidden transition-all animate-in slide-in-from-right-8 duration-300"
      dir="rtl"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-white/20 dark:border-white/10 flex flex-col gap-2 shrink-0 bg-white/10 dark:bg-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <Bot className="w-5 h-5 text-[var(--color-primary)]" />
            <div className="flex flex-col">
              <h3 className="font-bold text-sm">دستیار هوشمند</h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                <Cpu className="w-3 h-3 text-[var(--color-primary)]" />
                {currentModelName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-full transition-colors ${showSettings ? 'bg-[var(--color-primary)] text-white' : 'text-slate-500 hover:bg-slate-900/10 dark:hover:bg-white/10'}`}
              title="تنظیمات مدل و کلید API"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (window.confirm('آیا از پاک کردن تاریخچه چت مطمئن هستید؟')) {
                  setMessages([{ role: 'model', content: 'سلام! چطور می‌تونم بهتون کمک کنم؟' }]);
                }
              }}
              className="p-1.5 text-slate-500 hover:bg-slate-900/10 dark:hover:bg-white/10 rounded-full transition-colors"
              title="پاک کردن تاریخچه"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:bg-slate-900/10 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel (Model & API Keys) */}
        {showSettings && (
          <div className="animate-in slide-in-from-top-2 flex flex-col gap-3 p-3 mt-1 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/15 shadow-xl max-h-[350px] overflow-y-auto scrollbar-thin">
            {/* Success Toast / Notification */}
            {saveSuccessMsg && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Model Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  انتخاب مدل هوش مصنوعی
                </span>
                {!isUserPremium && (
                  <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                    <Crown className="w-3 h-3" /> ارتقا به پرمیوم
                  </span>
                )}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-xl px-3 py-2 text-[12px] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-medium cursor-pointer"
              >
                <optgroup label="مدل‌های رایگان (Gemini API)">
                  {AVAILABLE_MODELS.filter(m => !m.isPremium).map(m => (
                    <option key={m.id} value={m.id} className="text-slate-800 bg-white dark:bg-slate-800 dark:text-white py-1">
                      {m.name} - {m.desc}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="مدل‌های پرمیوم انانویا (NVIDIA Engine 👑)">
                  {AVAILABLE_MODELS.filter(m => m.isPremium).map(m => (
                    <option key={m.id} value={m.id} className="text-slate-800 bg-white dark:bg-slate-800 dark:text-white py-1">
                      {m.name} {!isUserPremium ? '(پرمیوم 👑)' : '- ' + m.desc}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="h-[1px] bg-slate-200 dark:bg-white/10 my-0.5" />

            {/* API Key Input Section */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                کلید API جمنای (Gemini API Key)
              </label>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-100 dark:bg-white/5 p-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                لطفاً کلید API شخصی Gemini خود را وارد کنید. کلید شما به صورت کاملاً لوکال در مرورگر ذخیره می‌شود و پاک نخواهد شد.
              </div>

              <div className="flex gap-2">
                <input 
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-xl px-3 py-1.5 text-[12px] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 font-mono"
                  dir="ltr"
                />
                <button 
                  onClick={handleSaveApiKey}
                  disabled={!keyInput.trim()}
                  className="px-3.5 py-1.5 bg-[var(--color-primary)] text-white text-[12px] font-bold rounded-xl disabled:opacity-50 hover:brightness-110 transition-all shrink-0"
                >
                  ذخیره کلید
                </button>
              </div>

              {/* Saved Keys List */}
              {savedKeys.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">کلیدهای ذخیره‌شده لوکال:</span>
                  <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                    {savedKeys.map((k, idx) => {
                      const isActive = k === userApiKey;
                      const masked = k.length > 12 ? `${k.substring(0, 7)}...${k.substring(k.length - 4)}` : k;
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${
                            isActive 
                              ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 text-[var(--color-primary)]' 
                              : 'bg-white/40 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <button 
                            onClick={() => handleSelectKey(k)}
                            className="flex items-center gap-1.5 flex-1 text-right truncate"
                            title="انتخاب به عنوان کلید فعال"
                          >
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[var(--color-primary)]' : 'bg-slate-400'}`} />
                            <span dir="ltr">{masked}</span>
                            {isActive && <span className="text-[9px] font-sans font-bold bg-[var(--color-primary)]/20 px-1.5 py-0.5 rounded">فعال</span>}
                          </button>
                          <button 
                            onClick={() => handleRemoveKey(k)}
                            className="text-red-400 hover:text-red-600 p-0.5 rounded transition-colors mr-1"
                            title="حذف کلید"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-2 max-w-[90%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
          >
            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div 
              className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[var(--color-primary)] text-white rounded-tr-sm' 
                  : 'bg-white/60 dark:bg-[#2C2C2E]/80 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-white/40 dark:border-white/5'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg prose-pre:my-2">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {/* Preset Suggested Action Button for Auto-Organizing */}
        {messages.length <= 1 && !isLoading && (
          <div className="my-2 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">دستورات پیشنهادی:</span>
            <button
              onClick={() => {
                const promptText = "می‌خواهم نشانک‌هایم در صفحه ai list مرتب و دسته‌بندی شوند.";
                setInput(promptText);
                setTimeout(() => {
                  if (!userApiKey) {
                    setMessages(prev => [...prev, { role: 'model', content: 'لطفاً ابتدا از بخش تنظیمات ⚙️ کلید API شخصی Gemini خود را وارد و ذخیره کنید.' }]);
                    setShowSettings(true);
                    return;
                  }
                  const currentHistory = messages.filter(m => !m.content.includes('خطایی رخ داد') && !m.content.includes('لطفاً ابتدا از بخش تنظیمات'));
                  setMessages([...currentHistory, { role: 'user', content: promptText }]);
                  setIsLoading(true);
                  callGeminiApi(promptText, currentHistory)
                    .then(reply => {
                      setMessages(prev => [...prev, { role: 'model', content: reply }]);
                    })
                    .catch(err => {
                      setMessages(prev => [...prev, { role: 'model', content: `خطا: ${err.message || 'خطای ناشناخته'}` }]);
                    })
                    .finally(() => {
                      setIsLoading(false);
                      setInput('');
                    });
                }, 50);
              }}
              className="text-right p-3 rounded-xl bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 text-[var(--color-primary)] text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer group shadow-sm"
            >
              <span>✨ شروع مرتب‌سازی هوشمند نشانک‌ها در صفحه ai list</span>
              <span className="text-[10px] bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform">شروع</span>
            </button>
          </div>
        )}
        {isLoading && (
          <div className="flex items-start gap-2 max-w-[90%] self-start">
            <div className="shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-white/60 dark:bg-[#2C2C2E]/80 rounded-tl-sm border border-white/40 dark:border-white/5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              <span className="text-[11px] text-slate-400">در حال تولید پاسخ با {currentModelName}...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/20 dark:border-white/10 shrink-0 bg-white/10 dark:bg-black/10">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="پیام خود را بنویسید..."
            className="w-full bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-full py-2.5 pr-4 pl-12 text-[13px] text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--color-primary)] text-white rounded-full hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all"
          >
            <Send className="w-4 h-4 -ml-0.5 mt-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
