import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { initDB, getDB } from "./server/db.ts";

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

dotenv.config();

async function startServer() {
  initDB();
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing
  app.use(express.json());

  // API endpoint to scrape and enhance bookmark metadata
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "A valid URL string is required." });
      }

      // Add protocol if missing
      let formattedUrl = url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(formattedUrl);
      } catch (err) {
        return res.status(400).json({ error: "Invalid URL format." });
      }
      const domain = parsedUrl.hostname;
      const origin = parsedUrl.origin;

      console.log(`Attempting to scrape url: ${formattedUrl} for domain: ${domain}`);

      // Basic regex scraper results
      let siteTitle = domain;
      let siteDesc = "ذخیره شده از وب";
      let faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

      try {
        // Fetch raw HTML page to extract metadata
        const response = await fetch(formattedUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
          },
          signal: AbortSignal.timeout(6000) // 6 seconds timeout
        });

        if (response.ok) {
          const html = await response.text();

          // 1. Parse Title
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            siteTitle = titleMatch[1].trim();
          } else {
            // Try open graph title
            const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
            if (ogTitleMatch && ogTitleMatch[1]) {
              siteTitle = ogTitleMatch[1].trim();
            }
          }

          // 2. Parse Description
          const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                            html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
          if (descMatch && descMatch[1]) {
            siteDesc = descMatch[1].trim();
          }

          // 3. Parse custom Link favicon
          const linkIconMatch = html.match(/<link[^>]*rel=["'](?:shortcut |apple-touch-)?icon["'][^>]*href=["']([^"']*)["']/i);
          if (linkIconMatch && linkIconMatch[1]) {
            const rawFavicon = linkIconMatch[1].trim();
            if (rawFavicon.startsWith("http")) {
              faviconUrl = rawFavicon;
            } else if (rawFavicon.startsWith("/")) {
              faviconUrl = `${origin}${rawFavicon}`;
            } else {
              faviconUrl = `${origin}/${rawFavicon}`;
            }
          }
        }
      } catch (fetchErr) {
        console.warn(`Scrape fetch failed for URL ${formattedUrl}:`, fetchErr);
        // Fall back gracefully. Google favicon can still work on the client side!
      }

      // Propose clean title and category based on domain keywords
      let suggestedCategory = "عمومی"; // General
      let suggestedGradient = "from-blue-500 to-sky-600";
      let suggestedTags = ["وب"];
      let cleanTitle = siteTitle;
      
      if (cleanTitle === domain) {
        cleanTitle = domain.split(".")[0];
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
      }

      if (/github|gitlab|bitbucket|stackoverflow|dev|npm/i.test(domain)) {
        suggestedCategory = "فناوری";
        suggestedGradient = "from-slate-700 to-slate-900";
        suggestedTags = ["Dev", "Code"];
      } else if (/figma|dribbble|behance|pinterest|unsplash|canva/i.test(domain)) {
        suggestedCategory = "طراحی";
        suggestedGradient = "from-[#F24E1E] to-[#FF7043]";
        suggestedTags = ["UI/UX", "Art"];
      } else if (/youtube|netflix|spotify|soundcloud|twitch/i.test(domain)) {
        suggestedCategory = "سرگرمی";
        suggestedGradient = "from-red-500 to-rose-600";
        suggestedTags = ["Media", "Play"];
      } else if (/wikipedia|medium|coursera|udemy|notion/i.test(domain)) {
        suggestedCategory = "آموزشی";
        suggestedGradient = "from-teal-500 to-emerald-600";
        suggestedTags = ["Docs", "Edu"];
      } else if (/twitter|x\.com|facebook|instagram|linkedin/i.test(domain)) {
        suggestedCategory = "اجتماعی";
        suggestedGradient = "from-[#1DA1F2] to-[#007AFF]";
        suggestedTags = ["Social", "Connect"];
      }

      res.json({
        url: formattedUrl,
        title: cleanTitle,
        description: siteDesc === "ذخیره شده از وب" ? `نمای کلی وب‌سایت در صفحه ${cleanTitle}` : siteDesc,
        favicon: faviconUrl,
        logoFallback: `https://logo.clearbit.com/${domain}`,
        category: suggestedCategory,
        gradient: suggestedGradient,
        tags: suggestedTags,
        domain
      });

    } catch (err: any) {
      console.error("Server API Scraper error:", err);
      res.status(500).json({ error: "Failed to scrape the website metadata." });
    }
  });


  // Auth endpoints
  // Guest Login endpoint for server
  app.post("/api/auth/guest", (req, res) => {
    try {
      const db = getDB();
      const id = 'guest_' + Math.random().toString(36).substr(2, 9);
      const name = 'کاربر مهمان';
      const email = `guest_${Date.now()}@example.com`; // Unique email so they are registered as distinct entries if needed

      db.run('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)', [id, name, email, 'guest-no-password'], (err) => {
        if (err) return res.status(500).json({ error: "خطا در ورود مهمان" });
        
        // Find the user to get their numeric ID
        db.get('SELECT * FROM users WHERE id = ?', [id], (err: any, user: any) => {
           const finalUser = user || { id, name, email };
           const token = jwt.sign({ id: finalUser.id, email: finalUser.email }, JWT_SECRET, { expiresIn: '1d' });
           res.json({ token, user: { id: finalUser.id, numericId: finalUser.numericId, name: finalUser.name, email: finalUser.email, picture: '' } });
        });
      });
    } catch (err) {
      res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) return res.status(400).json({ error: "تمام فیلدها الزامی هستند" });
      
      const db = getDB();
      db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) return res.status(500).json({ error: "خطای سرور" });
        if (row) return res.status(400).json({ error: "ایمیل تکراری است" });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = Math.random().toString(36).substr(2, 9);
        
        db.run('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)', [id, name, email, hashedPassword], (err) => {
          if (err) return res.status(500).json({ error: "خطا در ثبت نام" });
          
          const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
          res.json({ token, user: { id, name, email, picture: '' } });
        });
      });
    } catch (err) {
      res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "ایمیل و رمز عبور الزامی هستند" });
      
      const db = getDB();
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err: any, user: any) => {
        if (err) return res.status(500).json({ error: "خطای سرور" });
        if (!user || !user.password) return res.status(400).json({ error: "ایمیل یا رمز عبور اشتباه است" });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "ایمیل یا رمز عبور اشتباه است" });
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
      });
    } catch (err) {
      res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { token } = req.body;
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.VITE_GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) return res.status(400).json({ error: "توکن نامعتبر" });
      
      const { sub: googleId, email, name, picture } = payload;
      const db = getDB();
      
      db.get('SELECT * FROM users WHERE email = ?', [email], (err: any, user: any) => {
        if (err) return res.status(500).json({ error: "خطای سرور" });
        
        if (user) {
          const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
          return res.json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
        } else {
          const id = Math.random().toString(36).substr(2, 9);
          db.run('INSERT INTO users (id, name, email, picture, provider) VALUES (?, ?, ?, ?, ?)', [id, name, email, picture, 'google'], (err) => {
            if (err) return res.status(500).json({ error: "خطا در ساخت کاربر" });
            const jwtToken = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token: jwtToken, user: { id, name, email, picture } });
          });
        }
      });
    } catch (err) {
      res.status(500).json({ error: "خطا در احراز هویت گوگل" });
    }
  });

  // Gemini Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "A valid message string is required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: message,
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      res.status(500).json({ error: "Failed to generate AI response." });
    }
  });


  // Get all users for admin
  app.get("/api/admin/users", (req, res) => {
    try {
      const db = getDB();
      db.all('SELECT * FROM users', [], (err: any, users: any[]) => {
        if (err) return res.status(500).json({ error: "خطای سرور در دریافت کاربران" });
        // Return without password for security
        const safeUsers = users.map((u: any) => ({
          id: u.id,
          numericId: u.numericId || (typeof u.id === 'number' ? u.id : parseInt(u.id.replace(/\D/g, '')) || 0),
          name: u.name,
          email: u.email,
          joinDate: u.createdAt || new Date().toISOString(),
          status: 'active'
        }));
        res.json({ users: safeUsers });
      });
    } catch (err) {
      res.status(500).json({ error: "خطای سرور" });
    }
  });

  // Download complete database backup
  app.get("/api/admin/backup", (req, res) => {
    try {
      const dbPath = path.join(process.cwd(), 'database.json');
      if (fs.existsSync(dbPath)) {
        res.download(dbPath, `backup_database_${new Date().toISOString().split('T')[0]}.json`);
      } else {
        res.status(404).json({ error: "دیتابیس یافت نشد" });
      }
    } catch (err) {
      res.status(500).json({ error: "خطا در تهیه بکاپ" });
    }
  });

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
          envContent += `\nGEMINI_API_KEY_${index + 1}=${key}`;
          newKeysCount++;
        }
      });
      
      if (newKeysCount > 0) {
        fs.writeFileSync(envPath, envContent.trim() + '\n');
      }
      
      res.json({ success: true, count: newKeysCount });
    } catch (err: any) {
      console.error("Export env error:", err);
      res.status(500).json({ error: "Failed to export keys" });
    }
  });

  // Apply Vite dev server or production static serving

  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite Dev Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // PORT constraint is 3000, DO NOT CHANGE
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
  
  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is in use, retrying...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT, "0.0.0.0");
      }, 1000);
    }
  });
}

startServer();
