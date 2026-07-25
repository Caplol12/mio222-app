const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf8');

const targetUseEffectStart = `  // Distribute items into columns based on settings
  const [columns, setColumns] = useState<Record<string, string[]>>({});

  useEffect(() => {`;

const replacementUseEffectStart = `  // Distribute items into columns based on settings
  const [columns, setColumns] = useState<Record<string, string[]>>({});
  const prevCategoriesRef = React.useRef(categories);

  useEffect(() => {`;

code = code.replace(targetUseEffectStart, replacementUseEffectStart);

const targetBlock = `    if (!loaded) {
      let index = 0;
      availableCategories.forEach(cat => {
        cols[\`col\${(index % numCols) + 1}\`].push(\`cat-\${cat.id}\`);
        index++;
      });
      
      if (widgetVisibility.pomodoro) cols.col1.push('widget-pomodoro');
      if (widgetVisibility.notes) (cols.col2 || cols.col1).push('widget-notes');
      if (widgetVisibility.calendar) (cols.col3 || cols.col1).push('widget-calendar');
    } else {
      const existing = new Set<string>();
      Object.values(cols).forEach(colItems => colItems.forEach(item => existing.add(item)));
      
      availableCategories.forEach(cat => {
        if (!existing.has(\`cat-\${cat.id}\`)) {
          const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
          cols[shortestCol].push(\`cat-\${cat.id}\`);
          existing.add(\`cat-\${cat.id}\`);
        }
      });
      
      const validCategoryIds = new Set(availableCategories.map(c => \`cat-\${c.id}\`));
      const seenItems = new Set<string>();
      
      Object.keys(cols).forEach(colId => {
        cols[colId] = cols[colId].filter(id => {
          if (seenItems.has(id)) return false; // Deduplicate!
          seenItems.add(id);
          
          if (id.startsWith('cat-')) return validCategoryIds.has(id);
          if (id.startsWith('widget-')) return widgetVisibility[id.replace('widget-', '') as keyof typeof widgetVisibility];
          return true;
        });
      });
      
      if (widgetVisibility.pomodoro && !existing.has('widget-pomodoro')) {
        const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
        cols[shortestCol].push('widget-pomodoro');
      }
      if (widgetVisibility.notes && !existing.has('widget-notes')) {
        const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
        cols[shortestCol].push('widget-notes');
      }
      if (widgetVisibility.calendar && !existing.has('widget-calendar')) {
        const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
        cols[shortestCol].push('widget-calendar');
      }
    }`;

const replacementBlock = `    const prevCatIds = new Set(prevCategoriesRef.current.map(c => c.id));
    const newCategories = categories.filter(c => !prevCatIds.has(c.id));
    prevCategoriesRef.current = categories;

    if (!loaded) {
      if (widgetVisibility.pomodoro) cols.col1.push('widget-pomodoro');
      if (widgetVisibility.notes) (cols.col2 || cols.col1).push('widget-notes');
      if (widgetVisibility.calendar) (cols.col3 || cols.col1).push('widget-calendar');
    } else {
      const existing = new Set<string>();
      Object.values(cols).forEach(colItems => colItems.forEach(item => existing.add(item)));
      
      // Auto-add only newly created categories, NOT all available categories
      newCategories.forEach(cat => {
        if (!existing.has(\`cat-\${cat.id}\`)) {
          const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
          cols[shortestCol].push(\`cat-\${cat.id}\`);
          existing.add(\`cat-\${cat.id}\`);
        }
      });
      
      const validCategoryIds = new Set(availableCategories.map(c => \`cat-\${c.id}\`));
      const seenItems = new Set<string>();
      
      Object.keys(cols).forEach(colId => {
        cols[colId] = cols[colId].filter(id => {
          if (seenItems.has(id)) return false; // Deduplicate!
          seenItems.add(id);
          
          if (id.startsWith('cat-')) return validCategoryIds.has(id);
          if (id.startsWith('widget-')) return widgetVisibility[id.replace('widget-', '') as keyof typeof widgetVisibility];
          return true;
        });
      });
      
      if (widgetVisibility.pomodoro && !existing.has('widget-pomodoro')) {
        const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
        cols[shortestCol].push('widget-pomodoro');
      }
      if (widgetVisibility.notes && !existing.has('widget-notes')) {
        const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
        cols[shortestCol].push('widget-notes');
      }
      if (widgetVisibility.calendar && !existing.has('widget-calendar')) {
        const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
        cols[shortestCol].push('widget-calendar');
      }
    }`;

if (code.includes(targetBlock)) {
  fs.writeFileSync('src/components/DraggableDashboard.tsx', code.replace(targetBlock, replacementBlock));
  console.log("Success");
} else {
  console.log("Target block not found");
}
