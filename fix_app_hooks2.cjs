const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const earlyReturnCode = `  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-white">در حال بارگذاری...</div>;
  if (!user) return <Navigate to="/login" replace />;`;

code = code.replace(earlyReturnCode, '');
code = code.replace(earlyReturnCode.replace('  ', ''), '');

const findReturn = code.indexOf('return (');
code = code.substring(0, findReturn) + earlyReturnCode + "\n\n  " + code.substring(findReturn);

fs.writeFileSync('src/App.tsx', code);
