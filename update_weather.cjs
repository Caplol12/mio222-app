const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const targetFunction = `function TopWeatherWidget() {
  const { getGlassStyle } = useGlassStyle();
  return (
    <div style={getGlassStyle()} className="border border-white/40 dark:border-white/10 rounded-[14px] px-3.5 py-1.5 flex flex-col items-end justify-center shadow-sm min-w-[85px] select-none h-[44px]" dir="ltr">
      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-[2px] leading-none">WEATHER</span>
      <span className="text-[16px] font-bold text-slate-800 dark:text-white leading-none mr-2">-</span>
    </div>
  );
}`;

const replacementFunction = `function TopWeatherWidget() {
  const { getGlassStyle } = useGlassStyle();
  const [weather, setWeather] = useState<{ temp: string, code: number } | null>(null);
  
  useEffect(() => {
    let isMounted = true;

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(\`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&current=temperature_2m,weather_code\`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (isMounted) {
          setWeather({
            temp: Math.round(data.current.temperature_2m).toString() + '°',
            code: data.current.weather_code
          });
        }
      } catch (err) {
        console.error("Weather fetch error", err);
        if (isMounted) setWeather({ temp: '-', code: 0 });
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          // Fallback to Tehran
          fetchWeather(35.6892, 51.3890);
        }
      );
    } else {
      fetchWeather(35.6892, 51.3890);
    }
    
    return () => { isMounted = false; };
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️'; 
    if (code === 1 || code === 2 || code === 3) return '⛅'; 
    if (code === 45 || code === 48) return '🌫️'; 
    if (code >= 51 && code <= 67) return '🌧️'; 
    if (code >= 71 && code <= 77) return '❄️'; 
    if (code >= 80 && code <= 82) return '🌧️'; 
    if (code >= 85 && code <= 86) return '❄️'; 
    if (code >= 95) return '⛈️'; 
    return '⛅';
  };

  return (
    <div style={getGlassStyle()} className="border border-white/40 dark:border-white/10 rounded-[14px] px-3.5 py-1.5 flex flex-col items-end justify-center shadow-sm min-w-[85px] select-none h-[44px]" dir="ltr">
      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-[2px] leading-none">WEATHER</span>
      <div className="flex items-center gap-1.5 leading-none">
        <span className="text-[12px]">{weather ? getWeatherIcon(weather.code) : '⏳'}</span>
        <span className="text-[16px] font-bold text-slate-800 dark:text-white leading-none mr-1">
          {weather ? weather.temp : '-'}
        </span>
      </div>
    </div>
  );
}`;

if(code.includes(targetFunction)) {
  code = code.replace(targetFunction, replacementFunction);
  fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
  console.log("Updated weather widget successfully.");
} else {
  console.log("Could not find the target function.");
}
