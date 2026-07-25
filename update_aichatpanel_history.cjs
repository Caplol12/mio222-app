const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatPanel.tsx', 'utf-8');

// 1. Remove isSettingsOpen state
code = code.replace(
  "  const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n",
  ""
);

// 2. Modify messages state to use localStorage
code = code.replace(
  "  const [messages, setMessages] = useState<Message[]>([\n    { role: 'model', content: 'سلام! چطور می‌تونم بهتون کمک کنم؟' }\n  ]);",
  `  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem('ai_chat_history');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [{ role: 'model', content: 'سلام! چطور می‌تونم بهتون کمک کنم؟' }];
  });

  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages));
  }, [messages]);`
);

// 3. Remove isSettingsOpen from useEffect dependency
code = code.replace(
  `  useEffect(() => {
    if (!isSettingsOpen) {
      scrollToBottom();
    }
  }, [messages, isSettingsOpen]);`,
  `  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);`
);

// 4. Update Header buttons
const headerTarget = `        <div className="flex items-center gap-1">
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
        </div>`;

const headerRepl = `        <div className="flex items-center gap-1">
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
        </div>`;

code = code.replace(headerTarget, headerRepl);

// 5. Update header title
code = code.replace(
  `<h3 className="font-bold">{isSettingsOpen ? 'تنظیمات چت‌بات' : 'دستیار هوشمند'}</h3>`,
  `<h3 className="font-bold">دستیار هوشمند</h3>`
);

// 6. Remove the settings block and replace conditional rendering
const settingsBlockTarget = /      \{isSettingsOpen \? \([\s\S]*?      \) : \(/;
code = code.replace(settingsBlockTarget, "      {");

// Also remove handleAddKey, handleRemoveKey, and newKeyInput since they're no longer used
code = code.replace(/  const \[newKeyInput, setNewKeyInput\] = useState\(''\);\n/g, "");
code = code.replace(/  const handleAddKey = \(\) => \{[\s\S]*?\};\n/g, "");
code = code.replace(/  const handleRemoveKey = \(keyToRemove: string\) => \{[\s\S]*?\};\n/g, "");

fs.writeFileSync('src/components/AIChatPanel.tsx', code);
