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
      return stored ? JSON.parse(stored) : { defaultAiModel: 'gemini-2.0-flash', chatbotEnabled: true };
    } catch {
      return { defaultAiModel: 'gemini-2.0-flash', chatbotEnabled: true };
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
      let currentApiKeys = apiKeys;
      const DEFAULT_KEYS = ['AQ.Ab8RN6I4OC4_mIAFDvXMDMcqsajwQ1OdSGye7F9Zzp9tsYt1WQ', 'AQ.Ab8RN6IFI1cqGpPRRb8e7BofiIYoZ97XAwkBmL0KgJYlb3cSPQ'];
      
      try {
        const stored = localStorage.getItem('gemini_api_keys');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) {
            currentApiKeys = parsed;
            setApiKeys(currentApiKeys);
          } else {
            currentApiKeys = DEFAULT_KEYS;
          }
        } else {
          currentApiKeys = DEFAULT_KEYS;
        }
      } catch (e) {
        currentApiKeys = DEFAULT_KEYS;
      }
  
      if (currentApiKeys.length === 0) {
        throw new Error('No API keys configured.');
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

    let attempts = 0;
    let index = currentKeyIndex;

    while (attempts < currentApiKeys.length) {
      const currentKey = currentApiKeys[index];
      const now = Date.now();
      const cooldownUntil = cooldowns[currentKey] || 0;

      if (now >= cooldownUntil) {
        // Try this key
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${adminSettings.defaultAiModel || 'gemini-2.0-flash'}:generateContent?key=${currentKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            // 429, 403 or server errors
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!text) {
             throw new Error('Invalid response format');
          }

          // Update index for round-robin
          setCurrentKeyIndex((index + 1) % currentApiKeys.length);
          return text;

        } catch (error: any) {
          console.error(`Error with key ${currentKey.substring(0, 5)}...:`, error);
          // Set cooldown for 60 seconds
          setCooldowns(prev => ({ ...prev, [currentKey]: Date.now() + 60000 }));
        }
      }

      // Move to next key
      index = (index + 1) % currentApiKeys.length;
      attempts++;
    }

    throw new Error('تمام کلیدها با خطا مواجه شدند یا در حالت انتظار هستند (۶۰ ثانیه صبر کنید). لطفاً از سالم بودن کلیدهای API اطمینان حاصل کنید.');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (apiKeys.length === 0) {
      setMessages(prev => [...prev, { role: 'model', content: 'لطفاً ابتدا از بخش تنظیمات کلید API را وارد کنید.' }]);
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
      let errorMsg = 'متاسفانه خطایی رخ داد. لطفا دوباره تلاش کنید.';
      if (error.message.includes('No API keys')) {
        errorMsg = 'لطفاً کلید API را وارد کنید.';
      } else if (error.message.includes('All keys')) {
        errorMsg = 'تمام کلیدها با خطا مواجه شدند یا در حالت انتظار هستند (۶۰ ثانیه صبر کنید).';
      }
      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
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
      <div className="p-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/10 dark:bg-black/10">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          <Bot className="w-5 h-5 text-[var(--color-primary)]" />
          <h3 className="font-bold">دستیار هوشمند</h3>
        </div>
        <div className="flex items-center gap-1">
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
