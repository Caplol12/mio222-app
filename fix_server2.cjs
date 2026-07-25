const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = `import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { initDB, getDB } from "./server/db.ts";

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
` + code;

fs.writeFileSync('server.ts', code);
