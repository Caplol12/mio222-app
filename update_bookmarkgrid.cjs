const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const oldLines = `  const [widgetVisibility, setWidgetVisibility] = useState(() => { try { const s = localStorage.getItem("dash_widgets"); return s ? JSON.parse(s) : {calendar: true, weather: true, notes: true, pomodoro: true, clock: true, search: true, board: true}; } catch { return {calendar: true, weather: true, notes: true, pomodoro: true, clock: true, search: true, board: true}; }});
  React.useEffect(() => { localStorage.setItem("dash_widgets", JSON.stringify(widgetVisibility)); }, [widgetVisibility]);`;

const newLines = `  const [allWidgetVisibility, setAllWidgetVisibility] = useState<Record<string, any>>(() => {
    try {
      const s = localStorage.getItem("dash_widgets_per_page");
      if (s) return JSON.parse(s);
      
      const old = localStorage.getItem("dash_widgets");
      const defaultWidgets = old ? JSON.parse(old) : {calendar: true, weather: true, notes: true, pomodoro: true, clock: true, search: true, board: true};
      return { 'home': defaultWidgets };
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    localStorage.setItem("dash_widgets_per_page", JSON.stringify(allWidgetVisibility));
  }, [allWidgetVisibility]);

  const widgetVisibility = allWidgetVisibility[activePage] || {calendar: true, weather: true, notes: true, pomodoro: true, clock: true, search: true, board: true};

  const setWidgetVisibility = (updater: any) => {
    setAllWidgetVisibility(prev => {
      const current = prev[activePage] || {calendar: true, weather: true, notes: true, pomodoro: true, clock: true, search: true, board: true};
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activePage]: next };
    });
  };`;

code = code.replace(oldLines, newLines);
fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
