export interface Note {
  id: string;
  text: string;
  createdAt: number;
  completed?: boolean;
  color?: string;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  favicon: string;
  category: string;
  gradient: string;
  tags: string[];
  domain: string;
  favorite: boolean;
  pageId?: string;
  createdAt: number;
  clickCount: number;
  pricing?: "free" | "paid" | "freemium";
  readLater?: boolean;
  status?: "ok" | "broken" | "checking";
}

export type ThemeMode = "ios-light" | "ios-dark" | "glass-cosmic" | "sunset-glow" | "nature-breeze" | "ocean-wave" | "cyberpunk";

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  gradient?: string;
  isPrivate?: boolean;
  password?: string;
  isSmart?: boolean;
  smartTags?: string[];
}

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: "all", name: "همه بوکمارک‌ها", icon: "bookmark" },
  { id: "favs", name: "علاقه‌مندی‌ها", icon: "star" },
  { id: "read-later", name: "بعداً می‌خوانم", icon: "clock" },
  { id: "عمومی", name: "عمومی", icon: "globe", gradient: "from-slate-400 to-slate-600" }
];

export interface AppSettings {
  backgroundImage: string;
  themeMode: ThemeMode;
}