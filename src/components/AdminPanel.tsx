import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { isAdmin } from '../utils/admin';
import React, { useState, useEffect } from 'react';
import { Settings, Users, Key, Save, ArrowLeft, Search, Plus, Trash2, XCircle, FileCode, Crown, UserCheck, UserX } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';
import { fetchAllSharedUsers, updateSharedUserPremiumStatus, updateSharedUserStatus, syncUserToSharedDatabase, UserRecord } from '../utils/userSync';
import LiveLogViewer from './LiveLogViewer';

// Types
type User = UserRecord;

interface AdminSettings {
  defaultAiModel: string;
  chatbotEnabled: boolean;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { getGlassStyle } = useGlassStyle();

  // --- All Hooks defined at top-level ---
  const [activeTab, setActiveTab] = useState<'users' | 'keys' | 'settings'>('users');

  // --- API Keys State ---
  const [apiKeys, setApiKeys] = useState<string[]>(['AQ.Ab8RN6I4OC4_mIAFDvXMDMcqsajwQ1OdSGye7F9Zzp9tsYt1WQ', 'AQ.Ab8RN6IFI1cqGpPRRb8e7BofiIYoZ97XAwkBmL0KgJYlb3cSPQ']);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // --- Users State ---
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  // --- Settings State ---
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    defaultAiModel: 'gemini-2.5-flash',
    chatbotEnabled: true,
  });

  // Add User State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addIsPremium, setAddIsPremium] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      const allUsers = await fetchAllSharedUsers();
      setUsers(allUsers);
      setSelectedUser(prev => prev ? (allUsers.find(u => u.id === prev.id || (u.numericId && u.numericId === prev.numericId)) ?? prev) : null);
    } catch (err) {
      console.warn('Failed to fetch shared users:', err);
    } finally {
      setIsFetchingUsers(false);
    }
  };

  // Load initial data & auto-refresh interval for users
  useEffect(() => {
    // Load Keys
    try {
      const storedKeys = localStorage.getItem('gemini_api_keys');
      if (storedKeys) {
        const parsed = JSON.parse(storedKeys);
        if (parsed && parsed.length > 0) {
          setApiKeys(parsed);
        } else {
          setApiKeys(['AQ.Ab8RN6I4OC4_mIAFDvXMDMcqsajwQ1OdSGye7F9Zzp9tsYt1WQ', 'AQ.Ab8RN6IFI1cqGpPRRb8e7BofiIYoZ97XAwkBmL0KgJYlb3cSPQ']);
          localStorage.setItem('gemini_api_keys', JSON.stringify(['AQ.Ab8RN6I4OC4_mIAFDvXMDMcqsajwQ1OdSGye7F9Zzp9tsYt1WQ', 'AQ.Ab8RN6IFI1cqGpPRRb8e7BofiIYoZ97XAwkBmL0KgJYlb3cSPQ']));
        }
      } else {
        localStorage.setItem('gemini_api_keys', JSON.stringify(['AQ.Ab8RN6I4OC4_mIAFDvXMDMcqsajwQ1OdSGye7F9Zzp9tsYt1WQ', 'AQ.Ab8RN6IFI1cqGpPRRb8e7BofiIYoZ97XAwkBmL0KgJYlb3cSPQ']));
      }
    } catch {}

    // Load Settings
    try {
      const storedSettings = localStorage.getItem('admin_settings');
      if (storedSettings) setAdminSettings(JSON.parse(storedSettings));
    } catch {}

    fetchUsers();

    // Auto-poll user updates every 8 seconds
    const interval = setInterval(() => {
      fetchUsers();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // --- Keys Handlers ---
  const handleAddKey = () => {
    if (newKeyInput.trim() && !apiKeys.includes(newKeyInput.trim())) {
      const newKeys = [...apiKeys, newKeyInput.trim()];
      setApiKeys(newKeys);
      localStorage.setItem('gemini_api_keys', JSON.stringify(newKeys));
      setNewKeyInput('');
      showToast('کلید با موفقیت اضافه شد');
    }
  };

  const handleRemoveKey = (keyToRemove: string) => {
    const newKeys = apiKeys.filter(k => k !== keyToRemove);
    setApiKeys(newKeys);
    localStorage.setItem('gemini_api_keys', JSON.stringify(newKeys));
    showToast('کلید حذف شد');
  };

  const handleExportEnv = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/export-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ keys: apiKeys })
      });
      if (res.ok) {
        showToast('کلیدها به فایل .env منتقل شدند');
      } else {
        showToast('خطا در انتقال کلیدها (دسترسی غیرمجاز)');
      }
    } catch {
      showToast('خطا در ارتباط با سرور');
    }
  };

  // --- User Handlers ---
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchNumericId = u.numericId ? u.numericId.toString().includes(q) : false;
    const matchId = (u.id || '').toLowerCase().includes(q);
    const matchName = (u.name || '').toLowerCase().includes(q);
    const matchEmail = (u.email || '').toLowerCase().includes(q);
    return matchNumericId || matchId || matchName || matchEmail;
  });

  const toggleUserStatus = async (targetUser: User) => {
    const newStatus = targetUser.status === 'disabled' ? 'active' : 'disabled';
    const targetId = targetUser.numericId || targetUser.id;
    try {
      const updatedList = await updateSharedUserStatus(targetId, newStatus);
      setUsers(updatedList);
      if (selectedUser && (selectedUser.id === targetUser.id || selectedUser.numericId === targetUser.numericId)) {
        setSelectedUser(updatedList.find(u => u.id === targetUser.id || u.numericId === targetUser.numericId) || null);
      }
      showToast(`وضعیت کاربر به ${newStatus === 'active' ? 'فعال' : 'غیرفعال'} تغییر یافت`);
    } catch (err) {
      showToast('خطا در تغییر وضعیت کاربر');
    }
  };

  const handleTogglePremium = async (targetUser: User, makePremium: boolean) => {
    const targetId = targetUser.numericId || targetUser.id;
    try {
      const updatedList = await updateSharedUserPremiumStatus(targetId, makePremium);
      setUsers(updatedList);

      const updatedSelected = updatedList.find(u => u.id === targetUser.id || (u.numericId && u.numericId === targetUser.numericId));
      if (updatedSelected) setSelectedUser(updatedSelected);

      showToast(makePremium ? 'کاربر به پرمیوم ارتقا یافت ⭐️' : 'عضویت پرمیوم کاربر لغو شد');
    } catch (err) {
      console.error('Failed to toggle premium:', err);
    }
  };

  // --- Settings Handlers ---
  const handleSaveSettings = () => {
    localStorage.setItem('admin_settings', JSON.stringify(adminSettings));
    showToast('تنظیمات ذخیره شد');
  };

  const handleAddUserByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) return;
    setIsAddingUser(true);

    try {
      const newUserRecord = await syncUserToSharedDatabase({
        id: 'user_' + Math.random().toString(36).substring(2, 10),
        name: addName.trim(),
        email: addEmail.trim(),
        isPremium: addIsPremium,
        provider: 'admin_created',
        createdAt: new Date().toISOString()
      });

      await fetchUsers();
      setSelectedUser(newUserRecord);
      setAddName('');
      setAddEmail('');
      setAddIsPremium(false);
      setIsAddUserModalOpen(false);
      showToast(`کاربر جدید با آیدی #${newUserRecord.numericId} با موفقیت افزوده شد!`);
    } catch (err: any) {
      showToast(err?.message || 'خطا در افزودن کاربر جدید');
    } finally {
      setIsAddingUser(false);
    }
  };

  // --- Admin Access Check (Condition after all hooks) ---
  if (!isAdmin(user?.email)) {
    return <Navigate to="/" replace />;
  }


  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans p-6" dir="rtl">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 text-white px-4 py-2 rounded-xl shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4">
          {toastMsg}
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141416] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                افزودن کاربر جدید به سیستم
              </h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserByAdmin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">نام کاربر</label>
                <input 
                  type="text"
                  required
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="مثلا: محمد رضایی"
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">ایمیل کاربر</label>
                <input 
                  type="email"
                  required
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-slate-300">وضعیت عضویت پرمیوم (VIP)</span>
                <input 
                  type="checkbox"
                  checked={addIsPremium}
                  onChange={e => setAddIsPremium(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-slate-950 font-bold rounded-xl text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {isAddingUser ? 'در حال ثبت...' : 'ایجاد و ذخیره کاربر'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-sm transition-all"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div style={getGlassStyle()} className="rounded-3xl p-6 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">پنل مدیریت</h1>
              <p className="text-sm text-slate-400 mt-1">مدیریت کاربران، وضعیت پرمیوم، کلیدهای API و تنظیمات سیستم</p>
            </div>
          </div>
          <a 
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به داشبورد
          </a>
        </div>

        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Sidebar */}
          <div style={getGlassStyle()} className="w-64 rounded-3xl p-4 border border-white/10 flex flex-col gap-2 shrink-0 h-full">
            <button 
              onClick={() => setActiveTab('keys')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'keys' ? 'bg-[var(--color-primary)] text-slate-900 shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <Key className="w-5 h-5" />
              کلیدهای API
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'users' ? 'bg-[var(--color-primary)] text-slate-900 shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <Users className="w-5 h-5" />
              مدیریت کاربران
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'settings' ? 'bg-[var(--color-primary)] text-slate-900 shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <Settings className="w-5 h-5" />
              تنظیمات سیستم
            </button>
          </div>

          {/* Main Content Area */}
          <div style={getGlassStyle()} className="flex-1 rounded-3xl border border-white/10 overflow-hidden flex flex-col h-full">
            
            {/* --- KEYS TAB --- */}
            {activeTab === 'keys' && (
              <div className="p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-[var(--color-primary)]" />
                    کلیدهای API گوگل (Gemini)
                  </h2>
                  <button 
                    onClick={handleExportEnv}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20 rounded-xl text-sm font-bold transition-all"
                  >
                    <FileCode className="w-4 h-4" />
                    انتقال به .env
                  </button>
                </div>
                
                <div className="flex gap-3 mb-8">
                  <input 
                    type="text" 
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                    placeholder="کلید API جدید را وارد کنید..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-mono text-left"
                    dir="ltr"
                  />
                  <button 
                    onClick={handleAddKey}
                    disabled={!newKeyInput.trim()}
                    className="px-6 py-3 bg-[var(--color-primary)] text-slate-900 rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {apiKeys.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      هیچ کلیدی یافت نشد.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {apiKeys.map((key, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                              <Key className="w-4 h-4 text-slate-300" />
                            </div>
                            <span className="font-mono text-sm tracking-wider" dir="ltr">
                              {key.substring(0, 10)}...{key.substring(key.length - 6)}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleRemoveKey(key)}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="حذف کلید"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- USERS TAB --- */}
            {activeTab === 'users' && (
              <div className="flex h-full">
                {/* Users List */}
                <div className="flex-1 border-l border-white/10 flex flex-col">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white">کاربران سیستم ({filteredUsers.length})</h2>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsAddUserModalOpen(true)} 
                          className="text-xs px-3 py-1.5 bg-[var(--color-primary)] text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1 hover:brightness-110 shadow"
                        >
                          <Plus className="w-3.5 h-3.5" /> افزودن کاربر
                        </button>
                        <button 
                          onClick={fetchUsers} 
                          className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-300 transition-all"
                        >
                          بروزرسانی لیست
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="جستجوی کاربر (آیدی عددی، نام، ایمیل)..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {filteredUsers.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        هیچ کاربر مطابق با جستجو پیدا نشد.
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {filteredUsers.map(u => (
                          <div 
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedUser?.id === u.id ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 shadow-md' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">{u.name}</span>
                                    {u.numericId && (
                                      <span className="bg-white/10 text-slate-300 font-mono text-[11px] px-2 py-0.5 rounded-md border border-white/10">
                                        #{u.numericId}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-0.5" dir="ltr">{u.email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {u.isPremium ? (
                                  <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-amber-400" /> پرمیوم
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-1 rounded-md font-medium bg-slate-800 text-slate-400 border border-white/5">
                                    عادی
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* User Details Panel */}
                <div className="w-80 bg-black/10 flex flex-col">
                  {selectedUser ? (
                    <div className="p-6 flex flex-col gap-5 overflow-y-auto">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                          {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white">{selectedUser.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            {selectedUser.isPremium ? (
                              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                                <Crown className="w-3.5 h-3.5" /> کاربر پرمیوم
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">کاربر عادی</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-3.5">
                        <div>
                          <div className="text-xs text-slate-500 mb-0.5">آیدی عددی (سرور)</div>
                          <div className="text-sm font-bold font-mono text-[var(--color-primary)]">
                            #{selectedUser.numericId || 'تعریف نشده'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-0.5">ایمیل</div>
                          <div className="text-sm font-medium text-slate-200 break-all" dir="ltr">{selectedUser.email}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-0.5">نوع اکانت</div>
                          <div className="text-sm font-medium text-slate-200">
                            {selectedUser.provider === 'google' ? 'Google Auth' : selectedUser.provider === 'guest' ? 'مهمان (Guest)' : 'ثبت نام مستقیم'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-0.5">شناسه متنی یکتا</div>
                          <div className="text-[11px] font-mono text-slate-400 break-all">{selectedUser.id}</div>
                        </div>
                      </div>

                      {/* Premium Toggle Section */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                        <div className="text-xs font-bold text-slate-300 mb-1">مدیریت سطح دسترسی و وضعیت</div>
                        {selectedUser.isPremium ? (
                          <button
                            onClick={() => handleTogglePremium(selectedUser, false)}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                          >
                            <XCircle className="w-4 h-4 text-amber-400" />
                            لغو عضویت پرمیوم
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTogglePremium(selectedUser, true)}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 hover:brightness-110 shadow-lg"
                          >
                            <Crown className="w-4 h-4" />
                            ارتقا به پرمیوم (VIP)
                          </button>
                        )}

                        {selectedUser.status === 'disabled' ? (
                          <button
                            onClick={() => toggleUserStatus(selectedUser)}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                          >
                            <UserCheck className="w-4 h-4 text-emerald-400" />
                            فعال‌سازی مجدد حساب کاربر
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleUserStatus(selectedUser)}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                          >
                            <UserX className="w-4 h-4 text-red-400" />
                            غیرفعال کردن حساب کاربر
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-6 text-center">
                      برای مشاهده جزئیات و مدیریت کاربر، یک مورد را از لیست انتخاب کنید
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
              <div className="p-8 flex flex-col h-full">
                <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[var(--color-primary)]" />
                  تنظیمات عمومی برنامه
                </h2>
                
                <div className="flex flex-col gap-6 max-w-xl">
                  {/* Default Model */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <label className="block text-sm font-bold text-white mb-2">مدل پیش‌فرض هوش مصنوعی</label>
                    <p className="text-xs text-slate-400 mb-4">مدلی که برای دستیار هوشمند و قابلیت‌های متنی استفاده می‌شود.</p>
                    <select
                      value={adminSettings.defaultAiModel}
                      onChange={(e) => setAdminSettings({ ...adminSettings, defaultAiModel: e.target.value })}
                      className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-800 dark:text-white"
                    >
                      <option value="gemini-2.5-flash" className="text-slate-800">gemini-2.5-flash (پیش‌فرض)</option>
                      <option value="gemini-2.5-pro" className="text-slate-800">gemini-2.5-pro</option>
                      <option value="gemini-2.0-flash" className="text-slate-800">gemini-2.0-flash</option>
                      <option value="gemini-1.5-pro" className="text-slate-800">gemini-1.5-pro</option>
                      <option value="gemini-1.5-flash" className="text-slate-800">gemini-1.5-flash</option>
                    </select>
                  </div>

                  {/* Chatbot Toggle */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white mb-1">قابلیت چت‌بات (دستیار هوشمند)</div>
                      <div className="text-xs text-slate-400">نمایش یا مخفی کردن دکمه و پنل دستیار هوشمند در داشبورد کاربران.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={adminSettings.chatbotEnabled}
                        onChange={e => setAdminSettings({...adminSettings, chatbotEnabled: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                  </div>
                  
                  <div className="mt-4">
                    <button 
                      onClick={handleSaveSettings}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--color-primary)] text-slate-900 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg"
                    >
                      <Save className="w-5 h-5" />
                      ذخیره تنظیمات
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Live Logs System Console */}
            <div className="mt-8">
              <LiveLogViewer title="سیستم متمرکز لاگ زنده و عیب‌یابی کاربران (Supabase & System Logs)" defaultExpanded={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
