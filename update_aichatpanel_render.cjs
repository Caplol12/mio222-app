const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatPanel.tsx', 'utf-8');

const targetReturn = code.substring(code.indexOf('  return (\n    <div \n      style={getGlassStyle()}'));
const properReturn = `  return (
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
    </div>
  );
}
`;

code = code.replace(targetReturn, properReturn);
fs.writeFileSync('src/components/AIChatPanel.tsx', code);
