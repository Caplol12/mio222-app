const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf8');
const target = `  const [columns, setColumns] = useState<Record<string, string[]>>({
    col1: [],
    col2: [],
    col3: []
  });`;
const replacement = `  const [columns, setColumns] = useState<Record<string, string[]>>({
    col1: [],
    col2: [],
    col3: []
  });
  const prevCategoriesRef = React.useRef(categories);`;
fs.writeFileSync('src/components/DraggableDashboard.tsx', code.replace(target, replacement));
