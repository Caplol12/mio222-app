const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatPanel.tsx', 'utf-8');

const targetFunc = `  const callGeminiApi = async (userMessage: string, history: Message[]): Promise<string> => {
    if (apiKeys.length === 0) {
      throw new Error('No API keys configured.');
    }`;

const replFunc = `  const callGeminiApi = async (userMessage: string, history: Message[]): Promise<string> => {
    let currentApiKeys = apiKeys;
    try {
      const stored = localStorage.getItem('gemini_api_keys');
      if (stored) {
        currentApiKeys = JSON.parse(stored);
        setApiKeys(currentApiKeys);
      }
    } catch (e) {}

    if (currentApiKeys.length === 0) {
      throw new Error('No API keys configured.');
    }`;

code = code.replace(targetFunc, replFunc);

code = code.replace(
  "while (attempts < apiKeys.length) {",
  "while (attempts < currentApiKeys.length) {"
);

code = code.replace(
  "const currentKey = apiKeys[index];",
  "const currentKey = currentApiKeys[index];"
);

code = code.replace(
  "setCurrentKeyIndex((index + 1) % apiKeys.length);",
  "setCurrentKeyIndex((index + 1) % currentApiKeys.length);"
);

fs.writeFileSync('src/components/AIChatPanel.tsx', code);
