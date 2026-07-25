const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatPanel.tsx', 'utf-8');

code = code.replace(
  "const [currentKeyIndex, setCurrentKeyIndex] = useState(0);",
  `const [currentKeyIndex, setCurrentKeyIndex] = useState(0);

  // Settings
  const [adminSettings, setAdminSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_settings');
      return stored ? JSON.parse(stored) : { defaultAiModel: 'gemini-2.5-flash', chatbotEnabled: true };
    } catch {
      return { defaultAiModel: 'gemini-2.5-flash', chatbotEnabled: true };
    }
  });`
);

// We need to change the hardcoded model
code = code.replace(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=",
  "https://generativelanguage.googleapis.com/v1beta/models/${adminSettings.defaultAiModel || 'gemini-2.5-flash'}:generateContent?key="
);

fs.writeFileSync('src/components/AIChatPanel.tsx', code);
