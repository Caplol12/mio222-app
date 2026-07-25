import React, { useState, useRef } from 'react';
import { X, Upload, FileJson } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';

export interface ParsedBookmark {
  title: string;
  url: string;
  icon?: string;
}

export interface ParsedFolder {
  id: string;
  name: string;
  path: string;
  bookmarks: ParsedBookmark[];
}

interface ImportBookmarksModalProps {
  onClose: () => void;
  onImport: (folder: ParsedFolder) => void;
}

export default function ImportBookmarksModal({ onClose, onImport }: ImportBookmarksModalProps) {
  const [folders, setFolders] = useState<ParsedFolder[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const html = event.target?.result as string;
      parseBookmarksHTML(html);
    };
    reader.readAsText(file);
  };

  const parseBookmarksHTML = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const parsedFolders: ParsedFolder[] = [];
    
    function traverse(dl: Element, currentPath: string, folderName: string) {
      const children = dl.children;
      const bookmarks: ParsedBookmark[] = [];
      
      for (let i = 0; i < children.length; i++) {
        const dt = children[i];
        if (dt.tagName === 'DT') {
          const h3 = dt.querySelector('H3');
          if (h3) {
            const subFolderName = h3.textContent || 'Unnamed Folder';
            const subDl = dt.querySelector('DL');
            if (subDl) {
              traverse(subDl, currentPath ? `${currentPath} · ${subFolderName}` : subFolderName, subFolderName);
            }
          } else {
            const a = dt.querySelector('A');
            if (a) {
              bookmarks.push({
                title: a.textContent || a.getAttribute('href') || '',
                url: a.getAttribute('href') || '',
                icon: a.getAttribute('icon') || undefined,
              });
            }
          }
        }
      }
      
      if (bookmarks.length > 0) {
        parsedFolders.push({
          id: Math.random().toString(36).substring(7),
          name: folderName,
          path: currentPath,
          bookmarks
        });
      }
    }
    
    const rootDl = doc.querySelector('DL');
    if (rootDl) {
      traverse(rootDl, '', 'Bookmarks');
    }
    
    setFolders(parsedFolders);
  };

  const handleImport = (folder: ParsedFolder) => {
    onImport(folder);
    setImportedIds(prev => new Set(prev).add(folder.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="ltr">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[500px] max-h-[80vh] bg-[#E5E9EC] dark:bg-[#2D333B] rounded-[24px] shadow-2xl overflow-hidden font-sans text-slate-800 dark:text-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-300 dark:border-white/10 flex items-center justify-between bg-[#E5E9EC] dark:bg-[#2D333B]">
          <h2 className="text-lg font-bold tracking-tight text-slate-700 dark:text-white">Import from Chrome Bookmarks</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {folders.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400">
                <FileJson className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-700 dark:text-white">Upload Bookmarks File</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-[280px]">
                  Export your bookmarks from Chrome (or any browser) as an HTML file and upload it here.
                </p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-6 py-2.5 bg-[var(--color-primary)] hover:brightness-110 active:scale-95 text-slate-900 dark:text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Select HTML File
              </button>
              <input 
                type="file" 
                accept=".html" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-200/60 dark:divide-white/10">
              {folders.map(folder => {
                const isImported = importedIds.has(folder.id);
                return (
                  <div key={folder.id} className="flex items-center justify-between p-4 hover:bg-slate-200/30 dark:hover:bg-white/5 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[15px] text-slate-700 dark:text-white" dir="rtl">{folder.name}</span>
                      <span className="text-[12px] text-slate-500 dark:text-slate-400">
                        {folder.path && folder.path !== 'Bookmarks' ? `${folder.path} · ` : ''}
                        {folder.bookmarks.length} bookmark{folder.bookmarks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleImport(folder)}
                      disabled={isImported}
                      className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all shadow-sm border ${
                        isImported 
                          ? 'bg-emerald-500 text-white border-emerald-600 cursor-default'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20 border-slate-300/50 dark:border-white/10 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {isImported ? 'Imported' : 'Import'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
