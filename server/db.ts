import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.json');

export interface DBUser {
  id: string;
  numericId: number;
  name: string;
  email: string;
  password?: string;
  picture?: string;
  provider: string;
  isPremium: boolean;
  createdAt: string;
}

let db = {
  users: [] as DBUser[]
};

export const getNextNumericId = (): number => {
  if (!db.users || db.users.length === 0) return 1001;
  const maxId = db.users.reduce((max, u) => {
    const num = typeof u.numericId === 'number' ? u.numericId : 1000;
    return num > max ? num : max;
  }, 1000);
  return maxId + 1;
};

export const initDB = () => {
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      db = JSON.parse(data);
      if (!db.users) db.users = [];
      
      // Ensure all existing users have numericId and isPremium
      let updated = false;
      let nextId = 1001;
      db.users.forEach(u => {
        if (!u.numericId) {
          u.numericId = nextId++;
          updated = true;
        } else {
          if (u.numericId >= nextId) nextId = u.numericId + 1;
        }
        if (u.isPremium === undefined) {
          u.isPremium = false;
          updated = true;
        }
      });
      if (updated) {
        saveDB();
      }
    } catch (e) {
      console.error("Failed to read DB", e);
    }
  } else {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  }
};

export const saveDB = () => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

export const getAllUsers = (): DBUser[] => {
  return db.users || [];
};

export const findUserById = (idOrNumericId: string | number): DBUser | undefined => {
  const strSearch = String(idOrNumericId).trim();
  return db.users.find(u => u.id === strSearch || String(u.numericId) === strSearch);
};

export const findUserByEmail = (email: string): DBUser | undefined => {
  if (!email) return undefined;
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const syncUserRecord = (userData: { id?: string; name?: string; email?: string; provider?: string }): DBUser => {
  let user: DBUser | undefined;

  if (userData.email) {
    user = findUserByEmail(userData.email);
  }
  if (!user && userData.id) {
    user = findUserById(userData.id);
  }

  if (user) {
    if (userData.name && userData.name !== user.name) user.name = userData.name;
    if (userData.provider && userData.provider !== user.provider) user.provider = userData.provider;
    if (!user.numericId) user.numericId = getNextNumericId();
    if (user.isPremium === undefined) user.isPremium = false;
    saveDB();
    return user;
  }

  const numericId = getNextNumericId();
  const newUser: DBUser = {
    id: userData.id || `user_${numericId}`,
    numericId,
    name: userData.name || (userData.email ? userData.email.split('@')[0] : `کاربر ${numericId}`),
    email: userData.email || `guest_${numericId}@local.app`,
    picture: '',
    provider: userData.provider || 'guest',
    isPremium: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB();
  return newUser;
};

export const updateUserPremiumStatus = (idOrNumericId: string | number, isPremium: boolean): DBUser | null => {
  const user = findUserById(idOrNumericId);
  if (!user) return null;
  user.isPremium = isPremium;
  saveDB();
  return user;
};

export const getDB = () => ({
  get: (query: string, params: any[], callback: (err: any, row: any) => void) => {
    if (query.includes('email = ?')) {
      const email = params[0];
      const user = findUserByEmail(email);
      callback(null, user || null);
    } else {
      callback(null, null);
    }
  },
  run: (query: string, params: any[], callback: (err: any) => void) => {
    if (query.includes('INSERT INTO users')) {
      const id = params[0];
      const name = params[1];
      const email = params[2];
      
      const numericId = getNextNumericId();
      let newUser: DBUser;
      if (params.length === 5) {
        newUser = { id, numericId, name, email, picture: params[3], provider: params[4], isPremium: false, createdAt: new Date().toISOString() };
      } else {
        newUser = { id, numericId, name, email, password: params[3], picture: '', provider: 'local', isPremium: false, createdAt: new Date().toISOString() };
      }
      
      db.users.push(newUser);
      saveDB();
      callback(null);
    } else {
      callback(new Error("Unsupported query"));
    }
  }
});

