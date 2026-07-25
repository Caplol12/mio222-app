const fs = require('fs');
let code = fs.readFileSync('src/components/WallpaperModal.tsx', 'utf-8');

const importStatement = `import { extractDominantColor } from "../utils/colorExtractor";\nimport React, { useState, useRef, useEffect } from "react";`;
code = code.replace(/import React, \{ useState, useRef \} from "react";/, importStatement);

const autoColorMatchLogic = `
  const applyAutoColorMatch = async (url, type) => {
    if (type !== 'image') return;
    try {
      const colors = await extractDominantColor(url);
      if (colors) {
        updateSettings({ primaryColor: colors.primary, boardColor: colors.board });
      }
    } catch (e) {
      console.error("Failed to extract color", e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      updateSettings({ backgroundUrl: url, backgroundType: type as any });
      
      if (settings.autoColorMatch) {
         applyAutoColorMatch(url, type);
      }
    };
    reader.readAsDataURL(file);
  };
`;

code = code.replace(/const handleFileUpload = \([\s\S]*?reader\.readAsDataURL\(file\);\n  \};/, autoColorMatchLogic);

// Patch the preset click
const presetClickRegex = /onClick=\{\(\) => updateSettings\(\{ backgroundUrl: preset\.url, backgroundType: preset\.type as any \}\)\}/;
const newPresetClick = `onClick={() => {
                  updateSettings({ backgroundUrl: preset.url, backgroundType: preset.type as any });
                  if (settings.autoColorMatch) {
                    applyAutoColorMatch(preset.url, preset.type);
                  }
                }}`;
code = code.replace(presetClickRegex, newPresetClick);

// Patch the toggle switch
const toggleRegex = /onClick=\{\(\) => updateSettings\(\{ autoColorMatch: !settings\.autoColorMatch \}\)\}/;
const newToggleClick = `onClick={() => {
               const newValue = !settings.autoColorMatch;
               updateSettings({ autoColorMatch: newValue });
               if (newValue && settings.backgroundType === 'image') {
                 applyAutoColorMatch(settings.backgroundUrl, 'image');
               }
           }}`;
code = code.replace(toggleRegex, newToggleClick);

fs.writeFileSync('src/components/WallpaperModal.tsx', code);
