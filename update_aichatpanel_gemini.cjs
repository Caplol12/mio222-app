const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatPanel.tsx', 'utf-8');

const oldCall = `  const callGeminiApi = async (userMessage: string, history: Message[]): Promise<string> => {
    // Basic history mapping
    const contents = history.filter(m => !m.content.includes('خطایی رخ داد')).map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    let startIndex = currentKeyIndex;
    
    // Try keys sequentially`;

const newCall = `  const callGeminiApi = async (userMessage: string, history: Message[]): Promise<string> => {
    const systemPrompt = \`شما دستیار هوشمند مدیر نشانک‌ها (Bookmarks Manager) هستید. شما به پایگاه داده نشانک‌ها و دسته‌بندی‌های کاربر دسترسی دارید. در صورتی که کاربر سوالی درباره نشانک‌ها پرسید بر اساس این داده‌ها به او پاسخ دهید:
دسته بندی ها: \${JSON.stringify(categories)}
نشانک ها: \${JSON.stringify(bookmarks)}\`;

    // Basic history mapping
    const contents = history.filter(m => !m.content.includes('خطایی رخ داد')).map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const requestBody = {
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }]
      },
      contents
    };

    let startIndex = currentKeyIndex;
    
    // Try keys sequentially`;

code = code.replace(oldCall, newCall);

code = code.replace(
  "body: JSON.stringify({ contents }),",
  "body: JSON.stringify(requestBody),"
);

fs.writeFileSync('src/components/AIChatPanel.tsx', code);
