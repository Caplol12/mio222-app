import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.json');

let db = {
  users: [] as any[]
};

export const initDB = () => {
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      db = JSON.parse(data);
      if (!db.users) db.users = [];
    } catch (e) {
      console.error("Failed to read DB", e);
    }
  } else {
    fs.writeFileSync(dbPath, JSON.stringify(db));
  }
};

const saveDB = () => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

export const getDB = () => ({
  get: (query: string, params: any[], callback: (err: any, row: any) => void) => {
    // Very simple mock of sqlite get for our specific queries
    if (query.includes('email = ?')) {
      const email = params[0];
      const user = db.users.find(u => u.email === email);
      callback(null, user || null);
    } else {
      callback(null, null);
    }
  },
  run: (query: string, params: any[], callback: (err: any) => void) => {
    if (query.includes('INSERT INTO users')) {
      // params depend on the query.
      // 1. [id, name, email, password] for local
      // 2. [id, name, email, picture, 'google'] for google
      const id = params[0];
      const name = params[1];
      const email = params[2];
      
      let newUser: any;
      if (params.length === 5) {
        newUser = { id, name, email, picture: params[3], provider: params[4], createdAt: new Date().toISOString() };
      } else {
        newUser = { id, name, email, password: params[3], picture: '', provider: 'local', createdAt: new Date().toISOString() };
      }
      
      db.users.push(newUser);
      saveDB();
      callback(null);
    } else {
      callback(new Error("Unsupported query"));
    }
  }
});
