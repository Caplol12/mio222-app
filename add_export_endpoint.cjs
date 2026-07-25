const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const exportEndpoint = `
  // Export API keys to .env
  app.post("/api/admin/export-env", async (req, res) => {
    try {
      const { keys } = req.body;
      if (!Array.isArray(keys)) {
        return res.status(400).json({ error: "Keys must be an array" });
      }
      
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }
      
      let newKeysCount = 0;
      keys.forEach((key, index) => {
        if (!envContent.includes(key)) {
          envContent += \`\\nGEMINI_API_KEY_\${index + 1}=\${key}\`;
          newKeysCount++;
        }
      });
      
      if (newKeysCount > 0) {
        fs.writeFileSync(envPath, envContent.trim() + '\\n');
      }
      
      res.json({ success: true, count: newKeysCount });
    } catch (err: any) {
      console.error("Export env error:", err);
      res.status(500).json({ error: "Failed to export keys" });
    }
  });

  // Apply Vite dev server or production static serving
`;

code = code.replace("  // Apply Vite dev server or production static serving", exportEndpoint);

fs.writeFileSync('server.ts', code);
