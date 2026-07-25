const fs = require('fs');
let code = fs.readFileSync('src/components/WidgetsPanel.tsx', 'utf-8');

const target = `
        {/* Weather */}
        <div className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Cloud className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium">Weather</span>
          </div>
          <div 
            onClick={() => toggle('weather')}
            className={\`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors \${visibility.weather ? 'bg-[var(--color-primary)]' : 'bg-slate-300 dark:bg-slate-600'}\`}
          >
            <div className={\`w-4 h-4 rounded-full bg-white transition-transform \${visibility.weather ? 'translate-x-4' : 'translate-x-0'}\`} />
          </div>
        </div>`;

code = code.replace(target, '');
fs.writeFileSync('src/components/WidgetsPanel.tsx', code);
