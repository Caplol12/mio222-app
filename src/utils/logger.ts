export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'error' | 'info' | 'success' | 'warn';
  source: string; // e.g. 'AuthPage', 'Database', 'AdminPanel', 'API'
  message: string;
  details?: any;
}

type LogListener = (logs: LogEntry[]) => void;

class Logger {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 150;

  constructor() {
    this.loadFromStorage();
    this.setupGlobalHandlers();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('app_live_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('app_live_logs', JSON.stringify(this.logs.slice(-this.maxLogs)));
    } catch {}
  }

  private notify() {
    this.saveToStorage();
    const copy = [...this.logs];
    this.listeners.forEach(fn => fn(copy));
  }

  private setupGlobalHandlers() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('GlobalUnhandledError', event.message || 'خطای غیرمنتظره جاوااسکریپت', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          errorStack: event.error?.stack
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        this.error('UnhandledPromise', reason?.message || String(reason) || 'خطای پرامیس پاسخ داده‌نشده', {
          reason: reason?.stack || reason
        });
      });
    }
  }

  public addLog(type: LogEntry['type'], source: string, message: string, details?: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      source,
      message,
      details: details ? (typeof details === 'object' ? JSON.parse(JSON.stringify(details, this.getCircularReplacer())) : details) : undefined
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.notify();
    
    // Also output to dev tools console
    const prefix = `[${entry.type.toUpperCase()}] [${entry.source}]`;
    if (type === 'error') console.error(prefix, message, details);
    else if (type === 'warn') console.warn(prefix, message, details);
    else console.log(prefix, message, details);
  }

  private getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    };
  }

  public error(source: string, message: string, details?: any) {
    this.addLog('error', source, message, details);
  }

  public info(source: string, message: string, details?: any) {
    this.addLog('info', source, message, details);
  }

  public success(source: string, message: string, details?: any) {
    this.addLog('success', source, message, details);
  }

  public warn(source: string, message: string, details?: any) {
    this.addLog('warn', source, message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const logger = new Logger();
