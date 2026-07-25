const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const videoTag = `<video 
           autoPlay 
           loop 
           muted 
           playsInline
          className="fixed inset-0 w-full h-full object-cover z-[-1] opacity-60"
        >`;
        
const newVideoTag = `<video 
          key={appSettings.backgroundUrl}
          autoPlay 
          loop 
          muted 
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-[-1] opacity-60"
        >`;

if (code.includes(videoTag)) {
  code = code.replace(videoTag, newVideoTag);
} else {
  // Try finding it with different whitespace
  const regex = /<video\s+autoPlay\s+loop\s+muted\s+playsInline\s+className="fixed inset-0 w-full h-full object-cover z-\[-1\] opacity-60"\s*>/m;
  if (regex.test(code)) {
    code = code.replace(regex, newVideoTag);
  } else {
    console.log("Could not find video tag");
  }
}

fs.writeFileSync('src/App.tsx', code);
