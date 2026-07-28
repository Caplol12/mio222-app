import React, { useState, useEffect } from 'react';
import { logger, LogEntry } from '../utils/logger';
import { Terminal, Trash2, ChevronDown, ChevronUp, Copy, Check, Bug, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface LiveLogViewerProps {
  title?: string;
  defaultExpanded?: boolean;
  filterSource?: string;
}

export default function LiveLogViewer({ title = 'سیستم لاگ زنده و عیب‌یابی (Live Error & DB Logs)', defaultExpanded = true, filterSource }: LiveLogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'error' | 'success' | 'info'>('all');

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      let filtered = newLogs;
      if (filterSource) {
        filtered = filtered.filter(l => l.source.toLowerCase().includes(filterSource.toLowerCase()));
      }
      setLogs(filtered);
    });
    return () => unsubscribe();
  }, [filterSource]);

  const handleCopy = (log: LogEntry) => {
    const text = `[${log.timestamp}] [${log.type.toUpperCase()}] [${log.source}] ${log.message} ${log.details ? JSON.stringify(log.details, null, 2) : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter(log => {
    if (selectedTypeFilter === 'all') return true;
    return log.type === selectedTypeFilter;
  });

  const getLogBadge = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> خطای کامل</span>;
      case 'success':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> موفق / دیتابیس</span>;
      case 'warn':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-xs flex items-center gap-1"><Bug className="w-3 h-3" /> هشدار</span>;
      default:
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs flex items-center gap-1"><Info className="w-3 h-3" /> اطلاعات</span>;
    }
  };

  return (
    <div className="w-full my-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-200 overflow-hidden shadow-2xl backdrop-blur-xl transition-all" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm text-slate-100">{title}</span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {filteredLogs.length} لاگ
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && (
            <>
              {/* Type Filter Buttons */}
              <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  onClick={() => setSelectedTypeFilter('all')}
                  className={`px-2 py-1 rounded-md transition ${selectedTypeFilter === 'all' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  همه
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('error')}
                  className={`px-2 py-1 rounded-md transition ${selectedTypeFilter === 'error' ? 'bg-red-900/60 text-red-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  خطاها ({logs.filter(l => l.type === 'error').length})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('success')}
                  className={`px-2 py-1 rounded-md transition ${selectedTypeFilter === 'success' ? 'bg-emerald-900/60 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  دیتابیس
                </button>
              </div>

              <button
                onClick={() => logger.clearLogs()}
                title="پاکسازی لاگ‌ها"
                className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Log Console Content */}
      {isExpanded && (
        <div className="max-h-80 overflow-y-auto p-4 space-y-3 font-mono text-xs text-left dir-ltr bg-slate-950/70">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-500 dir-rtl text-sm">
              هیچ لاگی ثبت نشده است. هنگام انجام عملیات، لاگ‌ها به صورت زنده اینجا نمایش داده می‌شوند.
            </div>
          ) : (
            filteredLogs.slice().reverse().map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-xl border transition-all ${
                  log.type === 'error'
                    ? 'bg-red-950/20 border-red-900/40 text-red-200'
                    : log.type === 'success'
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
                    : log.type === 'warn'
                    ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap dir-rtl">
                  <div className="flex items-center gap-2">
                    {getLogBadge(log.type)}
                    <span className="font-bold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                      {log.source}
                    </span>
                    <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                  </div>

                  <button
                    onClick={() => handleCopy(log)}
                    className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedId === log.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی لاگ</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-semibold text-slate-100 dir-rtl text-right my-1 text-sm break-words leading-relaxed">
                  {log.message}
                </div>

                {log.details && (
                  <pre className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto text-[11px] text-slate-300 leading-normal">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
