const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldStart = `export default function App() {
  const { user, isLoading: authLoading, logout } = useAuth();
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-white">در حال بارگذاری...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  const { settings: appSettings } = useSettings();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);`;

const newStart = `export default function App() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { settings: appSettings } = useSettings();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);`;

code = code.replace(oldStart, newStart);

const findReturn = code.indexOf('return (');
const earlyReturn = `  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-white">در حال بارگذاری...</div>;
  if (!user) return <Navigate to="/login" replace />;

`;

code = code.substring(0, findReturn) + earlyReturn + code.substring(findReturn);

fs.writeFileSync('src/App.tsx', code);
