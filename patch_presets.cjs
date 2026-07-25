const fs = require('fs');
let code = fs.readFileSync('src/components/WallpaperModal.tsx', 'utf-8');

const oldPresets = `  { type: 'image', url: 'https://images.unsplash.com/photo-1506744626753-dba7d41543f4?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2048&auto=format&fit=crop' },
  { type: 'gradient', url: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
  { type: 'gradient', url: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
];`;

const newPresets = `  { type: 'image', url: 'https://images.unsplash.com/photo-1506744626753-dba7d41543f4?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2048&auto=format&fit=crop' },
  { type: 'video', url: 'https://cdn.pixabay.com/video/2016/09/13/5052-181156847_tiny.mp4' },
  { type: 'video', url: 'https://cdn.pixabay.com/video/2020/05/21/40058-425442994_tiny.mp4' },
  { type: 'video', url: 'https://cdn.pixabay.com/video/2016/11/04/6253-191024317_tiny.mp4' },
  { type: 'gradient', url: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
  { type: 'gradient', url: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
];`;

if (code.includes(oldPresets)) {
  code = code.replace(oldPresets, newPresets);
} else {
  console.log("Could not find presets");
}

const oldImgTag = `{preset.type === 'image' && (
                  <img src={preset.url} alt="preset" className="w-full h-full object-cover" />
                )}`;
                
const newImgTag = `{preset.type === 'image' && (
                  <img src={preset.url} alt="preset" className="w-full h-full object-cover" />
                )}
                {preset.type === 'video' && (
                  <video src={preset.url} autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-none" />
                )}`;

if (code.includes(oldImgTag)) {
  code = code.replace(oldImgTag, newImgTag);
} else {
  console.log("Could not find img tag");
}

fs.writeFileSync('src/components/WallpaperModal.tsx', code);
