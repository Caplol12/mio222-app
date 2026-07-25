const fs = require('fs');
let code = fs.readFileSync('src/contexts/SettingsContext.tsx', 'utf-8');

const importStorage = `import { setItem, getItem } from '../utils/storage';\n`;
if (!code.includes(importStorage)) {
  code = code.replace(`import React,`, importStorage + `import React,`);
}

const useEffectStart = `useEffect(() => {
    localStorage.setItem('app_settings_v1', JSON.stringify(settings));`;

const newUseEffect = `const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    getItem('backgroundUrl').then((url) => {
      if (url) {
        setSettings(s => ({ ...s, backgroundUrl: url }));
      }
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const settingsToSave = { ...settings };
    if (settingsToSave.backgroundUrl && settingsToSave.backgroundUrl.length > 5000) {
      setItem('backgroundUrl', settingsToSave.backgroundUrl).catch(e => console.error(e));
      settingsToSave.backgroundUrl = 'indexeddb';
    } else {
      setItem('backgroundUrl', '').catch(e => console.error(e));
    }
    try {
      localStorage.setItem('app_settings_v1', JSON.stringify(settingsToSave));
    } catch (e) {
      console.error(e);
    }
`;

code = code.replace(useEffectStart, newUseEffect);

fs.writeFileSync('src/contexts/SettingsContext.tsx', code);
