import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { 
  SalesModule, 
  PurchasesModule, 
  InventoryModule, 
  ExpensesModule, 
  FinanceModule, 
  PayrollModule, 
  ReportsModule, 
  SettingsModule
} from './components/Modules';
import { AppRoute, User, UserRole } from './types';
import { ShieldCheck, User as UserIcon, Lock, AlertCircle } from 'lucide-react';

// Firebase Imports
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBZJYT8U392L9gJ2JNfP4sk2VCfpke7yo8",
  authDomain: "my-store-manager-8697b.firebaseapp.com",
  projectId: "my-store-manager-8697b",
  storageBucket: "my-store-manager-8697b.firebasestorage.app",
  messagingSenderId: "990849651692",
  appId: "1:990849651692:web:f9a424276483258337a6c9",
  measurementId: "G-KB2VEXMQQJ"
};

// Initialize Firebase safely
let app: any;
let auth: any;
let db: any;
let isFirebaseConfigured = false;

try {
  // Check if an app is already initialized (e.g. by firebase-init.js)
  if (getApps().length > 0) {
      app = getApp();
  } else {
      app = initializeApp(firebaseConfig);
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseConfigured = true;
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

// Login Component
const LoginScreen: React.FC<{ onLogin: (email: string, pass: string) => Promise<void>, loading: boolean, error: string }> = ({ onLogin, loading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-cairo" dir="rtl">
        <div className="bg-white p-8 rounded-xl max-w-md text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">خطأ في الاتصال</h2>
          <p className="text-gray-600 mb-4">فشل الاتصال بقاعدة البيانات.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-cairo" dir="rtl">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-indigo-800 w-1/2 p-12 text-white relative overflow-hidden">
           <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 mix-blend-multiply opacity-50 blur-3xl"></div>
           <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500 rounded-full translate-x-1/2 translate-y-1/2 mix-blend-multiply opacity-50 blur-3xl"></div>
           <div className="z-10 text-center">
             <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">E</div>
             <h1 className="text-4xl font-bold mb-4">نظام إنجاز (SaaS)</h1>
             <p className="text-lg text-blue-100">سجل الدخول لإدارة حسابات شركتك.</p>
           </div>
        </div>

        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <div className="text-center md:text-right mb-10">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">تسجيل الدخول</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">يرجى إدخال البريد الإلكتروني وكلمة المرور</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 animate-in slide-in-from-top-2 border border-red-100">
                <AlertCircle size={16} className="mt-0.5 min-w-[16px]" />
                <div className="flex flex-col gap-1">
                    <span className="font-bold">خطأ في الدخول</span>
                    <span>{error}</span>
                    {error.includes('لوحة التحكم') && (
                        <a href="./admin.html" className="text-red-700 underline font-bold mt-1">
                            الذهاب لإنشاء حساب &larr;
                        </a>
                    )}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pl-10"
                  required
                />
                <UserIcon size={18} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">كلمة المرور</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pl-10"
                  required
                />
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>دخول آمن</span>
                </>
              )}
            </button>
            
            <div className="text-center pt-4 border-t border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-500 mb-2">ليس لديك حساب؟</p>
                <a href="./admin.html" className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline">
                    إنشاء حساب جديد (SaaS Admin)
                </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Error/Block Screen
const BlockScreen: React.FC<{ message: string, onLogout: () => void }> = ({ message, onLogout }) => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-cairo" dir="rtl">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl animate-in zoom-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle width={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">تنبيه اشتراك</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button onClick={onLogout} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">تسجيل خروج</button>
        </div>
    </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [blockMessage, setBlockMessage] = useState<string | null>(null);

  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  
  // Local Data for Users (Internal Roles)
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('app_users_v3');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  // --- AUTH LISTENER ---
  useEffect(() => {
    if (!isFirebaseConfigured) {
        setAuthLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            // User logged in, now check SaaS Subscription (Middleware)
            try {
                // IMPORTANT: According to your schema
                // Collection: 'users'
                // Document ID: firebaseUser.email
                if (!firebaseUser.email) throw new Error("No Email Found");

                const docRef = doc(db, "users", firebaseUser.email);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    // Try to provide a helpful error if auth exists but no db record
                    console.error("Auth exists but no Firestore User Document for:", firebaseUser.email);
                    setBlockMessage("خطأ في البيانات: الحساب موجود ولكن لا يوجد سجل اشتراك (Users Doc). يرجى مراجعة الدعم الفني.");
                    setIsAuthenticated(false);
                } else {
                    const subData = docSnap.data();
                    
                    // --- Date Logic ---
                    // expiryDate is "YYYY-MM-DD"
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Reset time to start of day

                    const expiryDateStr = subData.expiryDate; // "2030-01-01"
                    const expiryDate = new Date(expiryDateStr);
                    // Reset time for expiryDate to ensure fair comparison
                    expiryDate.setHours(0, 0, 0, 0);

                    // --- Validation Logic ---
                    if (subData.isActive !== true) {
                        setBlockMessage("تم إيقاف تفعيل هذا الحساب. يرجى التواصل مع الإدارة.");
                        setIsAuthenticated(false);
                    } else if (expiryDate < today) {
                        setBlockMessage(`عفواً، انتهت فترة اشتراكك بتاريخ ${expiryDateStr}. يرجى التجديد.`);
                        setIsAuthenticated(false);
                    } else {
                        // Success: Active and Valid Date
                        setBlockMessage(null);
                        setCurrentUser({
                            id: firebaseUser.uid,
                            username: firebaseUser.email?.split('@')[0] || 'user',
                            name: firebaseUser.displayName || 'عميل إنجاز',
                            role: UserRole.OWNER, // SaaS users are owners of their tenant
                            email: firebaseUser.email || ''
                        } as User);
                        setIsAuthenticated(true);
                    }
                }
            } catch (err) {
                console.error("Subscription Check Error:", err);
                setLoginError("فشل التحقق من صلاحية الاشتراك.");
                setBlockMessage("حدث خطأ أثناء التحقق من بيانات الاشتراك.");
            }
        } else {
            setCurrentUser(null);
            setIsAuthenticated(false);
        }
        setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const handleLogin = async (email: string, pass: string) => {
    if (!isFirebaseConfigured) return;
    setLoginError('');
    setAuthLoading(true);
    
    // Trim inputs to avoid whitespace errors
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    try {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        // Listener will handle state update
    } catch (err: any) {
        setAuthLoading(false);
        console.error("Login Error Details:", err.code, err.message);
        
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setLoginError("البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من إنشاء الحساب أولاً من لوحة التحكم.");
        } else if (err.code === 'auth/too-many-requests') {
            setLoginError("محاولات كثيرة خاطئة. يرجى الانتظار قليلاً أو إعادة تعيين كلمة المرور.");
        } else {
            setLoginError(`فشل تسجيل الدخول: ${err.message}`);
        }
    }
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured) {
        await signOut(auth);
    }
    setBlockMessage(null);
    window.location.reload();
  };

  // Internal User Management
  const handleCreateUser = (newUser: User) => {
      setUsers(prev => {
          const updated = [...prev, newUser];
          localStorage.setItem('app_users_v3', JSON.stringify(updated));
          return updated;
      });
  };
  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => {
          const updated = prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser, password: updatedUser.password || u.password } : u);
          localStorage.setItem('app_users_v3', JSON.stringify(updated));
          return updated;
      });
  };
  const handleDeleteUser = (userId: string) => {
      if (window.confirm("هل أنت متأكد؟")) {
          setUsers(prev => {
              const updated = prev.filter(u => u.id !== userId);
              localStorage.setItem('app_users_v3', JSON.stringify(updated));
              return updated;
          });
      }
  };

  // Render logic
  if (authLoading) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-cairo">
              <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>جاري التحقق من النظام...</p>
              </div>
          </div>
      );
  }

  if (blockMessage) {
      return <BlockScreen message={blockMessage} onLogout={handleLogout} />;
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginScreen onLogin={handleLogin} loading={authLoading} error={loginError} />;
  }

  const renderContent = () => {
    switch (activeRoute) {
      case AppRoute.DASHBOARD: return <Dashboard user={currentUser} />;
      case AppRoute.SALES: return <SalesModule user={currentUser} />;
      case AppRoute.PURCHASES: return <PurchasesModule user={currentUser} />;
      case AppRoute.INVENTORY: return <InventoryModule user={currentUser} />;
      case AppRoute.EXPENSES: return <ExpensesModule user={currentUser} />;
      case AppRoute.FINANCE: return <FinanceModule user={currentUser} />;
      case AppRoute.PAYROLL: return <PayrollModule onCreateUser={() => {}} onUpdateUser={() => {}} onDeleteUser={() => {}} user={currentUser} />;
      case AppRoute.REPORTS: return <ReportsModule user={currentUser} />;
      case AppRoute.SETTINGS: 
        return <SettingsModule 
          toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
          toggleLanguage={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')}
          theme={theme}
          language={language}
          user={currentUser}
          allUsers={users}
          onUpdateUser={handleUpdateUser}
          onCreateUser={handleCreateUser}
          onDeleteUser={handleDeleteUser}
        />;
      default: return <div>Not Found</div>;
    }
  };

  return (
    <Layout
      activeRoute={activeRoute}
      onNavigate={setActiveRoute}
      onLogout={handleLogout}
      user={currentUser}
      theme={theme}
      toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
      language={language}
      toggleLanguage={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;