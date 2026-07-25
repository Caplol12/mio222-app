import React, { useState, useEffect } from "react";
import { 
  X, 
  Link, 
  Folder, 
  Tag, 
  ChevronDown, 
  Save, 
  Sparkles, 
  Loader2, 
  CornerDownLeft,
  Sliders,
  Palette
} from "lucide-react";
import { Bookmark, CategoryItem } from "../types";
import { useSettings } from "../contexts/SettingsContext";

interface AddBookmarkModalProps {
  categories: CategoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmarkData: Partial<Bookmark>) => void;
  bookmarkToEdit?: Bookmark | null;
  activeCategory?: string;
}

const GRADIENTS = [
  { name: "آبی کلاسیک", value: "from-blue-500 to-sky-600" },
  { name: "قرمز انار", value: "from-red-500 to-rose-600" },
  { name: "اسلیت اقیانوسی", value: "from-slate-700 to-slate-900" },
  { name: "زرشکی غروب", value: "from-[#EA4C89] to-pink-500" },
  { name: "نارنجی فگما", value: "from-[#F24E1E] to-[#FF7043]" },
  { name: "بنفش ویولت", value: "from-violet-500 to-indigo-600" },
  { name: "زمردی جنگل", value: "from-emerald-500 to-teal-600" },
  { name: "طلایی گندم", value: "from-amber-400 to-orange-500" }
];

export default function AddBookmarkModal({
  categories,
  isOpen,
  onClose,
  onSave,
  bookmarkToEdit,
  activeCategory
}: AddBookmarkModalProps) {
  const { settings } = useSettings();
  const defaultCategory = (activeCategory && activeCategory !== "all" && activeCategory !== "favs") ? activeCategory : (settings.saveToBoard || "عمومی");

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [gradient, setGradient] = useState("from-blue-500 to-sky-600");
  const [tagsInput, setTagsInput] = useState("");
  const [favicon, setFavicon] = useState("");
  const [pricing, setPricing] = useState<"free" | "paid" | "freemium" | "">("free");
  
  // Scraper status variables
  const [isScraping, setIsScraping] = useState(false);

  const [scraperError, setScraperError] = useState<string | null>(null);
  const [isScrapeSuccess, setIsScrapeSuccess] = useState(false);

  // Manual configuration toggle
  const [showConfigDetails, setShowConfigDetails] = useState(false);

  // Load editing entity if toggled on
  useEffect(() => {
    if (bookmarkToEdit) {
      setUrl(bookmarkToEdit.url);
      setTitle(bookmarkToEdit.title);
      setDescription(bookmarkToEdit.description);
      setCategory(bookmarkToEdit.category);
      setGradient(bookmarkToEdit.gradient);
      setTagsInput(bookmarkToEdit.tags.join(", "));
      setFavicon(bookmarkToEdit.favicon);
      setPricing(bookmarkToEdit.pricing || "");
      setShowConfigDetails(true);
      setIsScrapeSuccess(true);
    } else {
      setUrl("");
      setTitle("");
      setDescription("");
      setCategory(defaultCategory);
      setGradient("from-blue-500 to-sky-600");
      setTagsInput("");
      setFavicon("");
      setPricing("free");
      setScraperError(null);
      setIsScraping(false);
      setIsScrapeSuccess(false);
      setShowConfigDetails(false);
    }
  }, [bookmarkToEdit, isOpen]);

  // Read URL clipboard dynamically if click paste
  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith("http")) {
        setUrl(text);
      }
    } catch (err) {
      // Permission denied or clipboard empty fallback gracefully
    }
  };

  // Run scraper API proxy in the server
  const triggerScraper = async (scrapedUrl: string) => {
    if (!scrapedUrl || scrapedUrl.length < 5) return;
    setIsScraping(true);
    setScraperError(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: scrapedUrl })
      });

      if (!response.ok) {
        throw new Error("سرویس فچ اطلاعات وب‌سایت با خطا مواجه شد.");
      }

      const data = await response.json();
      setTitle(data.title || "");
      setDescription(data.description || "");
      
      // Only use the AI's category if we're not inside a specific user folder, and if it's a valid category
      const isValidAI = categories.some(c => c.id === data.category);
      if (isValidAI && (!activeCategory || activeCategory === "all" || activeCategory === "favs" || activeCategory === "عمومی")) {
        setCategory(data.category);
      }
      
      setGradient(data.gradient || "from-blue-500 to-sky-600");
      setFavicon(data.favicon || "");
      if (data.tags && data.tags.length > 0) {
        setTagsInput(data.tags.join(", "));
      }

      setIsScrapeSuccess(true);
      setShowConfigDetails(true); // Open fields to adjust
    } catch (err: any) {
      setScraperError("امکان استخراج اطلاعات سایت نبود، اما می‌توانید دستی آن را تنظیم کنید.");
      setShowConfigDetails(true); // Open anyway for manual entry
    } finally {
      setIsScraping(false);
    }
  };

  const handleSave = () => {
    if (!url || !pricing) return;

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let finalDomain = "";
    try {
      let cleanUrl = url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`;
      }
      finalDomain = new URL(cleanUrl).hostname;
    } catch (e) {
      finalDomain = "link";
    }

    onSave({
      url,
      title: title || finalDomain,
      description: description || "ذخیره شده توسط کاربر",
      category,
      gradient,
      tags: parsedTags,
      domain: finalDomain,
      favicon: favicon || `https://www.google.com/s2/favicons?sz=128&domain=${finalDomain}`,
      pricing: pricing as "free" | "paid" | "freemium"
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dynamic blurred iOS backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
      ></div>

      {/* Modal Dialog Card */}
      <div className="relative bg-[#0A0A0B] border border-slate-900/10 dark:border-white/10 rounded-[32px] w-full max-w-lg p-6 overflow-hidden shadow-2xl transition-all duration-300 flex flex-col gap-6 max-h-[90vh] overflow-y-auto font-sans text-slate-900 dark:text-white">
        
        {/* Header content */}
        <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-4 select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">
              {bookmarkToEdit ? "ویرایش بوکمارک هوشمند" : "افزودن لینک جدید به کتابخانه"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-current/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col gap-5">
          {/* URL Input Box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white/60">آدرس لینک سایت (URL)</label>
            <div className="relative flex items-center">
              <Link className="absolute left-3 w-4 h-4 opacity-40 ml-0.5" />
              <input
                type="url"
                dir="ltr"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 rounded-xl py-3.5 pl-10 pr-20 text-sm font-semibold outline-none transition-all placeholder:text-slate-900 dark:text-white/30 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handlePasteUrl}
                className="absolute right-2 px-3 py-1.5 text-[10px] uppercase font-bold bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-xl transition-colors"
              >
                جایگذاری PASTE
              </button>
            </div>
          </div>
          
          {!showConfigDetails && url && (
            <button
              type="button"
              onClick={() => setShowConfigDetails(true)}
              className="w-full py-3 bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:bg-white/20 text-slate-900 dark:text-white rounded-xl text-sm font-bold transition-all"
            >
              ادامه و ثبت جزئیات
            </button>
          )}

          {/* Real-time Loader / Scraper shimmers */}
          {isScraping && (
            <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center gap-4 animate-pulse select-none">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-blue-400">هوش مصنوعی ژمینی در حال اسکن</h4>
                <p className="text-[10px] text-blue-400/70 mt-0.5">در حال دریافت لوگو، دسته بندی و خلاصه سایت...</p>
              </div>
            </div>
          )}

          {scraperError && (
            <div className="p-3 text-center text-xs bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-xl md:p-4">
              {scraperError}
            </div>
          )}

          {/* LIVE METADATA REVEAL CARD */}
          {isScrapeSuccess && (
            <div className="rounded-2xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 p-4 flex gap-4 items-center relative overflow-hidden group">
              {/* Back gradient glowing background */}
              <div className={`absolute top-0 right-0 w-2.5 h-full bg-gradient-to-b ${gradient}`}></div>
              
              {/* Logo / Favicon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${gradient} p-0.5 shadow flex-shrink-0`}>
                <div className="w-full h-full bg-[#0A0A0B] rounded-[14px] flex items-center justify-center p-2">
                  <img
                    src={favicon || `https://www.google.com/s2/favicons?sz=128&domain=link`}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Text display summary */}
              <div className="min-w-0 flex-1 pr-1 text-right">
                <h3 className="font-bold text-sm truncate">{title || "نام وبسایت"}</h3>
                <span className="text-[10px] bg-blue-500/15 text-blue-500 px-2 py-0.5 rounded-full font-bold inline-block mt-1">
                  {category}
                </span>
                <p className="text-xs opacity-60 mt-1.5 font-medium line-clamp-1">
                  {description || "وب‌سایت ثبت شده در آرشیو بوکمارک."}
                </p>
              </div>
            </div>
          )}

          {/* EDITABLE COMPONENT OPTIONS - Toggled or forced open */}
          {showConfigDetails && (
            <div className="flex flex-col gap-4 py-2 border-t border-slate-900/10 dark:border-white/10 mt-2">
              
              {/* Web Title field */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-900 dark:text-white/60">عنوان وب‌سایت</label>
                <input
                  type="text"
                  placeholder="سربرگ یا نام برند وب‌سایت"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all placeholder:text-slate-900 dark:text-white/30 text-slate-900 dark:text-white"
                />
              </div>

              {/* Web Description field */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-900 dark:text-white/60">توضیح کوتاه وب‌سایت (به فارسی)</label>
                <textarea
                  rows={2}
                  placeholder="خلاصه نحوه فعالیت این آدرس چیست؟"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all resize-none placeholder:text-slate-900 dark:text-white/30 text-slate-900 dark:text-white"
                />
              </div>

              {/* Group selection and tag layout */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Collection Group */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white/60">دسته‌بندی (پوشه)</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 rounded-xl py-3 pr-4 pl-8 text-sm font-semibold outline-none appearance-none transition-all text-slate-900 dark:text-white"
                    >
                      {categories.filter(c => c.id !== "all" && c.id !== "favs").map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0A0A0B]">
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-3.5 w-4 h-4 opacity-40 pointer-events-none" />
                  </div>
                </div>

                {/* Tags custom input */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white/60">برچسب‌ها (با کاما جدا کنید)</label>
                  <input
                    type="text"
                    placeholder="UI, Dev, Web"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm font-medium outline-none transition-all placeholder:text-slate-900 dark:text-white/30 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Pricing selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white/60">هزینه سرویس <span className="text-red-400">*</span></label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPricing("free")}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${pricing === 'free' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white/60 hover:bg-slate-900/10 dark:bg-white/10 hover:text-slate-900 dark:text-white'}`}
                  >
                    رایگان
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricing("freemium")}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${pricing === 'freemium' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white/60 hover:bg-slate-900/10 dark:bg-white/10 hover:text-slate-900 dark:text-white'}`}
                  >
                    متوسط
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricing("paid")}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${pricing === 'paid' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white/60 hover:bg-slate-900/10 dark:bg-white/10 hover:text-slate-900 dark:text-white'}`}
                  >
                    پولی
                  </button>
                </div>
              </div>

              {/* iOS gradient icon plate chooser */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-white/60 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-blue-400" />
                  <span>طرح پشت‌زمینه آیکون iOS</span>
                </label>
                <div className="flex flex-wrap gap-2.5 mt-1">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGradient(g.value)}
                      title={g.name}
                      className={`w-8 h-8 rounded-full bg-gradient-to-tr ${g.value} relative border hover:scale-105 active:scale-95 transition-all shadow-sm ${
                        gradient === g.value 
                          ? "ring-2 ring-blue-500 border-white" 
                          : "border-transparent"
                      }`}
                    >
                      {gradient === g.value && (
                        <span className="absolute inset-0 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-900/10 dark:border-white/10 pt-4 mt-2 select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-900 dark:text-white/60 hover:text-slate-900 dark:text-white bg-transparent hover:bg-slate-900/5 dark:bg-white/5 transition-all"
          >
            انصراف
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={!url}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 dark:text-white py-2.5 px-6 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره بوکمارک</span>
          </button>
        </div>
      </div>
    </div>
  );
}
