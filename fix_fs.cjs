const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

if (!code.includes('import fs from "fs";')) {
  code = code.replace(
    'import { GoogleGenAI } from "@google/genai";',
    'import { GoogleGenAI } from "@google/genai";\nimport fs from "fs";'
  );
}

fs.writeFileSync('server.ts', code);
