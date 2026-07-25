const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const startIdx = code.indexOf('function TopWeatherWidget() {');
const endMarker = '  return (\n    <div style={getGlassStyle()} className="border border-white/40 dark:border-white/10 rounded-[14px] px-3.5 py-1.5 flex flex-col items-end justify-center shadow-sm min-w-[85px] select-none h-[44px]" dir="ltr">\n      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-[2px] leading-none">WEATHER</span>\n      <div className="flex items-center gap-1.5 leading-none">\n        <span className="text-[12px]">{weather ? getWeatherIcon(weather.code) : \'⏳\'}</span>\n        <span className="text-[16px] font-bold text-slate-800 dark:text-white leading-none mr-1">\n          {weather ? weather.temp : \'-\'}\n        </span>\n      </div>\n    </div>\n  );\n}';

const endIdx = code.indexOf(endMarker);
if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx + endMarker.length);
}

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
