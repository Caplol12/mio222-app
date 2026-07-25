const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const importsTarget = 'import fs from "fs";\ndotenv.config();';
const importsReplacement = `import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { initDB, getDB } from "./server/db.js";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
`;

const initTarget = 'async function startServer() {\n  const app = express();';
const initReplacement = `async function startServer() {\n  initDB();\n  const app = express();`;

const endpointsTarget = '  // Gemini Chat endpoint';
const endpointsReplacement = `  // Auth endpoints
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
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
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
      
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
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

  // Gemini Chat endpoint`;

code = code.replace(importsTarget, importsReplacement);
code = code.replace(initTarget, initReplacement);
code = code.replace(endpointsTarget, endpointsReplacement);

fs.writeFileSync('server.ts', code);
