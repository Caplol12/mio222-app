const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatPanel.tsx', 'utf-8');

const targetFunction = `  const callGeminiApi = async (userMessage: string, history: Message[]): Promise<string> => {
    if (apiKeys.length === 0) {
      throw new Error('No API keys configured.');
    }

    const contents = [...history, { role: 'user', content: userMessage }].map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));`;

const replacementFunction = `  const callGeminiApi = async (userMessage: string, history: Message[]): Promise<string> => {
    if (apiKeys.length === 0) {
      throw new Error('No API keys configured.');
    }

    const systemPrompt = \`شما دستیار هوشمند مدیر نشانک‌ها (Bookmarks Manager) هستید. شما به پایگاه داده نشانک‌ها و دسته‌بندی‌های کاربر دسترسی دارید. در صورتی که کاربر سوالی درباره نشانک‌ها پرسید بر اساس این داده‌ها به او پاسخ دهید:
دسته بندی ها: \${JSON.stringify(categories)}
نشانک ها: \${JSON.stringify(bookmarks)}\`;

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
    };`;

code = code.replace(targetFunction, replacementFunction);
code = code.replace("body: JSON.stringify({ contents }),", "body: JSON.stringify(requestBody),");

fs.writeFileSync('src/components/AIChatPanel.tsx', code);
