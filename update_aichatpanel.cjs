const fs = require('fs');
let code = `import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, Loader2, Settings, Key, Trash2, Plus } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';
import ReactMarkdown from 'react-markdown';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface Cooldown {
  [key: string]: number;
}

export default function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const { getGlassStyle } = useGlassStyle();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'سلام! چطور می‌تونم بهتون کمک کنم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Settings & Keys State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('gemini_api_keys');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newKeyInput, setNewKeyInput] = useState('');
  
  // Runtime State for rotation
  const [cooldowns, setCooldowns] = useState<Cooldown>({});
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem('gemini_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isSettingsOpen) {
      scrollToBottom();
    }
  }, [messages, isSettingsOpen]);

  const handleAddKey = () => {
    if (newKeyInput.trim() && !apiKeys.includes(newKeyInput.trim())) {
      setApiKeys([...apiKeys, newKeyInput.trim()]);
      setNewKeyInput('');
    }
  };

  const handleRemoveKey = (keyToRemove: string) => {
    setApiKeys(apiKeys.filter(k => k !== keyToRemove));
  };

  const callGeminiApi = async (userMessage: string, history: Message[]): Promise<string> => {
    if (apiKeys.length === 0) {
      throw new Error('No API keys configured.');
    }

    const contents = [...history, { role: 'user', content: userMessage }].map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    let attempts = 0;
    let index = currentKeyIndex;

    while (attempts < apiKeys.length) {
      const currentKey = apiKeys[index];
      const now = Date.now();
      const cooldownUntil = cooldowns[currentKey] || 0;

      if (now >= cooldownUntil) {
        // Try this key
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

          const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${currentKey}\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            // 429, 403 or server errors
            throw new Error(\`HTTP error! status: \${response.status}\`);
          }

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!text) {
             throw new Error('Invalid response format');
          }

          // Update index for round-robin
          setCurrentKeyIndex((index + 1) % apiKeys.length);
          return text;

        } catch (error: any) {
          console.error(\`Error with key \${currentKey.substring(0, 5)}...:\`, error);
          // Set cooldown for 60 seconds
          setCooldowns(prev => ({ ...prev, [currentKey]: Date.now() + 60000 }));
        }
      }

      // Move to next key
      index = (index + 1) % apiKeys.length;
      attempts++;
    }

    throw new Error('All keys are in cooldown or failed.');
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
          <h3 className="font-bold">{isSettingsOpen ? 'تنظیمات چت‌بات' : 'دستیار هوشمند'}</h3>
        </div>
        <div className="flex items-center gap-1">
          {!isSettingsOpen && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-slate-500 hover:bg-slate-900/10 dark:hover:bg-white/10 rounded-full transition-colors"
              title="تنظیمات"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => {
              setIsSettingsOpen(false);
              onClose();
            }}
            className="p-1.5 text-slate-500 hover:bg-slate-900/10 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isSettingsOpen ? (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 text-slate-800 dark:text-slate-200">
          <div>
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Key className="w-4 h-4" /> کلیدهای API گوگل (Gemini)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              شما می‌توانید چندین کلید API اضافه کنید. سیستم به صورت چرخشی از آن‌ها استفاده می‌کند. در صورت بروز خطا (مثل 429)، کلید برای ۶۰ ثانیه کنار گذاشته می‌شود. کلیدها فقط در مرورگر شما ذخیره می‌شوند.
            </p>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddKey();
                }}
                placeholder="کلید API جدید..."
                className="flex-1 bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                dir="ltr"
              />
              <button 
                onClick={handleAddKey}
                disabled={!newKeyInput.trim()}
                className="px-3 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {apiKeys.length === 0 ? (
                <div className="text-xs text-center p-4 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-dashed border-slate-900/20 dark:border-white/20">
                  هیچ کلیدی وارد نشده است
                </div>
              ) : (
                apiKeys.map((key, idx) => {
                  const isCooldown = (cooldowns[key] || 0) > Date.now();
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-mono" dir="ltr">
                          {key.substring(0, 8)}...{key.substring(key.length - 4)}
                        </span>
                        {isCooldown && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-bold">در حال انتظار</span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleRemoveKey(key)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        title="حذف کلید"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="mt-auto pt-4 border-t border-white/20 dark:border-white/10">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-2.5 bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 border border-slate-900/10 dark:border-white/10 text-slate-800 dark:text-white rounded-xl text-sm font-bold transition-all"
            >
              بازگشت به چت
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={\`flex items-start gap-2 max-w-[90%] \${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}\`}
              >
                <div className={\`shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm \${msg.role === 'user' ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}\`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div 
                  className={\`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm \${
                    msg.role === 'user' 
                      ? 'bg-[var(--color-primary)] text-white rounded-tr-sm' 
                      : 'bg-white/60 dark:bg-[#2C2C2E]/80 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-white/40 dark:border-white/5'
                  }\`}
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
        </>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/AIChatPanel.tsx', code);
