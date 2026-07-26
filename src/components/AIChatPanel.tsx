import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, Loader2, Settings, Key, Trash2, Plus } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';
import ReactMarkdown from 'react-markdown';

import { Bookmark, CategoryItem } from '../types';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  categories: CategoryItem[];
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface Cooldown {
  [key: string]: number;
}

export default function AIChatPanel({ isOpen, onClose, bookmarks, categories }: AIChatPanelProps) {
  const { getGlassStyle } = useGlassStyle();
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
  
  // User's personal API key
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('user_gemini_api_key') || '';
    } catch { return ''; }
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  
  // Settings & Keys State
  const [apiKeys, setApiKeys] = useState<string[]>(() => {
    const DEFAULT_KEYS = ['AQ.Ab8RN6I4OC4_mIAFDvXMDMcqsajwQ1OdSGye7F9Zzp9tsYt1WQ', 'AQ.Ab8RN6IFI1cqGpPRRb8e7BofiIYoZ97XAwkBmL0KgJYlb3cSPQ'];
    try {
      const stored = localStorage.getItem('gemini_api_keys');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) return parsed;
      }
      localStorage.setItem('gemini_api_keys', JSON.stringify(DEFAULT_KEYS));
      return DEFAULT_KEYS;
    } catch {
      localStorage.setItem('gemini_api_keys', JSON.stringify(DEFAULT_KEYS));
      return DEFAULT_KEYS;
    }
  });
  
  // Runtime State for rotation
  const [cooldowns, setCooldowns] = useState<Cooldown>({});
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);

  // Settings
  const [adminSettings, setAdminSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_settings');
      return stored ? JSON.parse(stored) : { defaultAiModel: 'gemini-2.5-flash', chatbotEnabled: true };
    } catch {
      return { defaultAiModel: 'gemini-2.5-flash', chatbotEnabled: true };
    }
  });

  useEffect(() => {
    localStorage.setItem('gemini_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);



    const callGeminiApi = async (userMessage: string, history: Message[]): Promise<string> => {
      const currentKey = localStorage.getItem('user_gemini_api_key') || '';
      
      if (!currentKey.trim()) {
        throw new Error('لطفاً ابتدا کلید API شخصی خود را از طریق آیکون کلید ⚙️ وارد کنید.');
      }

      const systemPrompt = `شما دستیار هوشمند مدیر نشانک‌ها (Bookmarks Manager) هستید. شما به پایگاه داده نشانک‌ها و دسته‌بندی‌های کاربر دسترسی دارید. در صورتی که کاربر سوالی درباره نشانک‌ها پرسید بر اساس این داده‌ها به او پاسخ دهید:
دسته بندی ها: ${JSON.stringify(categories)}
نشانک ها: ${JSON.stringify(bookmarks)}`;

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

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${adminSettings.defaultAiModel || 'gemini-2.5-flash'}:generateContent?key=${currentKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 400) throw new Error('کلید API نامعتبر است. لطفاً کلید صحیح را وارد کنید.');
          if (response.status === 403) throw new Error('دسترسی رد شد. کلید API شما معتبر نیست یا منقضی شده.');
          if (response.status === 429) throw new Error('محدودیت درخواست. لطفاً کمی صبر کنید و دوباره امتحان کنید.');
          throw new Error(`خطای سرور گوگل: ${response.status}`);
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!userApiKey) {
      setMessages(prev => [...prev, { role: 'model', content: 'لطفاً ابتدا از طریق آیکون ⚙️ کلید API شخصی خود را وارد کنید.' }]);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    // Check if we need to filter out the previous error message
    const currentHistory = messages.filter(m => !m.content.includes('خطایی رخ داد') && !m.content.includes('لطفاً ابتدا از بخش تنظیمات'));
    
    setMessages([...currentHistory, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const reply = await callGeminiApi(userMessage, currentHistory);
      setMessages(prev => [...prev, { role: 'model', content: reply }]);
    } catch (error: any) {
      console.error('Error generating response:', error);
      // Directly show the error message returned from callGeminiApi since it's already localized and specific
      const errorMsg = error.message || 'خطای ناشناخته‌ای رخ داد.';
      setMessages(prev => [...prev, { role: 'model', content: `خطا: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={getGlassStyle()} 
      className="fixed right-24 top-24 bottom-24 w-[350px] z-50 rounded-[24px] shadow-2xl border border-white/40 dark:border-white/10 flex flex-col overflow-hidden transition-all animate-in slide-in-from-right-8 duration-300"
      dir="rtl"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/20 dark:border-white/10 flex flex-col gap-3 shrink-0 bg-white/10 dark:bg-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <Bot className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="font-bold">دستیار هوشمند</h3>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`p-1.5 rounded-full transition-colors ${showKeyInput ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-slate-500 hover:bg-slate-900/10 dark:hover:bg-white/10'}`}
              title="تنظیمات کلید API"
            >
              <Key className="w-4 h-4" />
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
        
        {/* API Key Input Section */}
        {showKeyInput && (
          <div className="animate-in slide-in-from-top-2 flex flex-col gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-white/40 dark:border-white/10">
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              برای استفاده از هوش مصنوعی، لطفاً کلید API شخصی خود (Gemini) را وارد کنید. کلید شما فقط در مرورگر خودتان ذخیره می‌شود.
            </div>
            <div className="flex gap-2">
              <input 
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={userApiKey ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                className="flex-1 bg-white/80 dark:bg-black/40 border border-white/60 dark:border-white/20 rounded-lg px-3 py-1.5 text-[12px] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              />
              <button 
                onClick={() => {
                  if (keyInput.trim()) {
                    const newKey = keyInput.trim();
                    setUserApiKey(newKey);
                    localStorage.setItem('user_gemini_api_key', newKey);
                    setKeyInput('');
                    setShowKeyInput(false);
                  }
                }}
                disabled={!keyInput.trim()}
                className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-[12px] font-medium rounded-lg disabled:opacity-50 hover:brightness-110 transition-all"
              >
                ذخیره
              </button>
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
        {isLoading && (
          <div className="flex items-start gap-2 max-w-[90%] self-start">
            <div className="shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-white/60 dark:bg-[#2C2C2E]/80 rounded-tl-sm border border-white/40 dark:border-white/5">
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
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
