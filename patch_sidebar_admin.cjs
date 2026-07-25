const fs = require('fs');
let code = fs.readFileSync('src/components/RightSidebar.tsx', 'utf-8');

const importAdmin = `import { isAdmin } from '../utils/admin';\n`;
if (!code.includes(importAdmin)) {
  code = importAdmin + code;
}

const adminButton = `<button 
        title="پنل مدیریت" 
        onClick={() => navigate('/admin')}
        style={buttonStyle}
        className="w-[50px] h-[50px] flex items-center justify-center rounded-full text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-all shadow-sm border border-white/10 hover:scale-105"
      >
        <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
      </button>`;

const newAdminButton = `{isAdmin(user?.email) && (
      <button 
        title="پنل مدیریت" 
        onClick={() => navigate('/admin')}
        style={buttonStyle}
        className="w-[50px] h-[50px] flex items-center justify-center rounded-full text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-all shadow-sm border border-white/10 hover:scale-105"
      >
        <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
      </button>
      )}`;

if (code.includes(adminButton)) {
  code = code.replace(adminButton, newAdminButton);
} else {
  console.log("Admin button not found");
}

fs.writeFileSync('src/components/RightSidebar.tsx', code);
