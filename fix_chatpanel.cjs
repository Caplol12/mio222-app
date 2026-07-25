const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatPanel.tsx', 'utf-8');

code = code.replace(
  '<ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg prose-pre:my-2">',
  '<div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg prose-pre:my-2">\n                <ReactMarkdown>'
);
code = code.replace(
  '</ReactMarkdown>',
  '</ReactMarkdown>\n              </div>'
);

fs.writeFileSync('src/components/AIChatPanel.tsx', code);
