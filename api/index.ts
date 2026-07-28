import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { initDB, getAllUsers, syncUserRecord, updateUserPremiumStatus, updateUserStatus, findUserById, findUserByEmail } from "../server/db.ts";

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

initDB();
const app = express();
app.use(express.json());

// Admin Middleware
const requireAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "توکن ارسال نشده است" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; email?: string };
    const user = decoded.id ? findUserById(decoded.id) : (decoded.email ? findUserByEmail(decoded.email) : undefined);
    if (!user) return res.status(401).json({ error: "کاربر یافت نشد" });
    const isAdminUser = user.isAdmin || (user.email && user.email.toLowerCase() === 'montill22k@gmail.com');
    if (!isAdminUser) return res.status(403).json({ error: "دسترسی غیرمجاز" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "توکن نامعتبر یا منقضی شده است" });
  }
};

// Auth Endpoints
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "ایمیل و رمز عبور الزامی است." });
    }
    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "این ایمیل قبلاً ثبت شده است." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = syncUserRecord({
      name: name || 'کاربر جدید',
      email,
      provider: 'email',
      isPremium: false
    });
    user.password = hashedPassword;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, isPremium: user.isPremium } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "خطا در ثبت نام کاربر" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "ایمیل و رمز عبور الزامی است." });
    }
    const user = findUserByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است." });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, isPremium: user.isPremium } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "خطا در ورود کاربر" });
  }
});

// Users Sync & Status
app.post("/api/users/sync", (req, res) => {
  try {
    const { id, name, email, provider, isPremium } = req.body || {};
    if (email) {
      const existing = findUserByEmail(email);
      if (existing && existing.id !== id && String(existing.numericId) !== String(id)) {
        return res.status(409).json({ error: "کاربری با این ایمیل از قبل وجود دارد" });
      }
    }
    const user = syncUserRecord({ id, name, email, provider, isPremium: isPremium === true || isPremium === "true" });
    res.json({
      user: {
        id: user.id,
        numericId: user.numericId,
        name: user.name,
        email: user.email,
        picture: user.picture || '',
        provider: user.provider,
        isPremium: !!user.isPremium,
        status: user.status || 'active',
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to sync user" });
  }
});

app.get("/api/users/status/:id", (req, res) => {
  try {
    const { id } = req.params;
    const user = findUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        id: user.id,
        numericId: user.numericId,
        name: user.name,
        email: user.email,
        picture: user.picture || '',
        provider: user.provider,
        isPremium: !!user.isPremium,
        status: user.status || 'active',
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user status" });
  }
});

// Admin User Endpoints
app.get("/api/admin/users", requireAdmin, (req, res) => {
  try {
    const users = getAllUsers().map(u => ({
      id: u.id,
      numericId: u.numericId,
      name: u.name,
      email: u.email,
      picture: u.picture || '',
      provider: u.provider,
      isPremium: !!u.isPremium,
      status: u.status || 'active',
      createdAt: u.createdAt
    }));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin users" });
  }
});

app.post("/api/admin/users/:id/premium", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { isPremium } = req.body;
    const premiumValue = isPremium === true || isPremium === "true";
    const updatedUser = updateUserPremiumStatus(id, premiumValue);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        numericId: updatedUser.numericId,
        name: updatedUser.name,
        email: updatedUser.email,
        picture: updatedUser.picture || '',
        provider: updatedUser.provider,
        isPremium: !!updatedUser.isPremium,
        status: updatedUser.status || 'active',
        createdAt: updatedUser.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user premium status" });
  }
});

app.post("/api/admin/users/:id/status", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== 'active' && status !== 'disabled') {
      return res.status(400).json({ error: "وضعیت نامعتبر است" });
    }
    const updatedUser = updateUserStatus(id, status);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        numericId: updatedUser.numericId,
        name: updatedUser.name,
        email: updatedUser.email,
        picture: updatedUser.picture || '',
        provider: updatedUser.provider,
        isPremium: !!updatedUser.isPremium,
        status: updatedUser.status || 'active',
        createdAt: updatedUser.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user status" });
  }
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
