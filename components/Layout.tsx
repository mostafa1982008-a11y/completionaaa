import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ShoppingBag, 
  Package, 
  Wallet, 
  Users, 
  PieChart, 
  Settings, 
  LogOut, 
  Menu, 
  Moon, 
  Sun,
  Globe,
  Bell,
  Search,
  Briefcase,
  ChevronRight,
  ArrowRight,
  Frown,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { AppRoute, User, UserRole, InventoryItem, Invoice } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  user: User | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: 'ar' | 'en';
  toggleLanguage: () => void;
}

interface SearchResult {
  type: string;
  title: string;
  subtitle: string;
  route: AppRoute;
}

interface NotificationItem {
    id: string;
    type: 'WARNING' | 'INFO';
    title: string;
    message: string;
    time: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeRoute, 
  onNavigate, 
  onLogout,
  user,
  theme,
  toggleTheme,
  language,
  toggleLanguage
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close search/notif results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Notifications Logic
  useEffect(() => {
    const fetchNotifications = () => {
        const notifs: NotificationItem[] = [];
        
        // Check Low Stock
        try {
            const inventory: InventoryItem[] = JSON.parse(localStorage.getItem('inventory_data_v3') || '[]');
            inventory.forEach(item => {
                if (item.quantity <= item.reorderLevel) {
                    notifs.push({
                        id: `stock-${item.id}`,
                        type: 'WARNING',
                        title: 'تنبيه مخزون',
                        message: `الكمية منخفضة للصنف: ${item.name} (${item.quantity})`,
                        time: 'الآن'
                    });
                }
            });
        } catch (e) {}

        // Check Pending Invoices
        try {
            const invoices: Invoice[] = JSON.parse(localStorage.getItem('invoices_data_v3') || '[]');
            const pending = invoices.filter(inv => inv.status === 'PENDING').length;
            if (pending > 0) {
                notifs.push({
                    id: 'inv-pending',
                    type: 'INFO',
                    title: 'فواتير معلقة',
                    message: `يوجد ${pending} فاتورة بإنتظار السداد`,
                    time: 'اليوم'
                });
            }
        } catch (e) {}

        setNotifications(notifs);
    };

    fetchNotifications();
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Debounced Search Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setShowResults(false); // Hide if term is too short
        return;
      }

      const results: SearchResult[] = [];
      const term = searchTerm.toLowerCase();

      // 1. Search Invoices
      try {
        const invoices = JSON.parse(localStorage.getItem('invoices_data_v3') || '[]');
        invoices.forEach((inv: any) => {
          if (inv.number.toLowerCase().includes(term) || inv.customerName.toLowerCase().includes(term)) {
            results.push({
              type: 'فاتورة مبيعات',
              title: inv.customerName,
              subtitle: `#${inv.number} - ${inv.amount}`,
              route: AppRoute.SALES
            });
          }
        });
      } catch (e) {}

      // 2. Search Inventory
      try {
        const inventory = JSON.parse(localStorage.getItem('inventory_data_v3') || '[]');
        inventory.forEach((item: any) => {
          if (item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term) || (item.barcode && item.barcode.includes(term))) {
            results.push({
              type: 'مخزون',
              title: item.name,
              subtitle: `${item.quantity} ${item.unit} - ${item.sku}`,
              route: AppRoute.INVENTORY
            });
          }
        });
      } catch (e) {}

      // 3. Search Suppliers
      try {
        const suppliers = JSON.parse(localStorage.getItem('suppliers_data_v3') || '[]');
        suppliers.forEach((sup: any) => {
          if (sup.name.toLowerCase().includes(term)) {
            results.push({
              type: 'مورد',
              title: sup.name,
              subtitle: sup.contact,
              route: AppRoute.PURCHASES
            });
          }
        });
      } catch (e) {}

      // 4. Search Employees
      try {
        const employees = JSON.parse(localStorage.getItem('employees_data_v3') || '[]');
        employees.forEach((emp: any) => {
          if (emp.name.toLowerCase().includes(term)) {
            results.push({
              type: 'موظف',
              title: emp.name,
              subtitle: emp.position,
              route: AppRoute.PAYROLL
            });
          }
        });
      } catch (e) {}

      // Filter search results based on permissions
      const filteredResults = results.filter(res => 
        user?.role === UserRole.OWNER || user?.permissions?.includes(res.route)
      );

      setSearchResults(filteredResults.slice(0, 10)); // Limit to 10 results
      setShowResults(true);

    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, user]);

  // Wrapper to clear search on navigation
  const handleNavigation = (route: AppRoute) => {
    setSearchTerm('');
    setShowResults(false);
    onNavigate(route);
  };

  const menuItems = [
    { id: AppRoute.DASHBOARD, label: language === 'ar' ? 'لوحة القيادة' : 'Dashboard', icon: LayoutDashboard },
    { id: AppRoute.SALES, label: language === 'ar' ? 'المبيعات' : 'Sales', icon: ShoppingCart },
    { id: AppRoute.PURCHASES, label: language === 'ar' ? 'المشتريات' : 'Purchases', icon: ShoppingBag },
    { id: AppRoute.INVENTORY, label: language === 'ar' ? 'المخزون' : 'Inventory', icon: Package },
    { id: AppRoute.FINANCE, label: language === 'ar' ? 'المالية والحسابات' : 'Finance', icon: PieChart },
    { id: AppRoute.EXPENSES, label: language === 'ar' ? 'المصروفات' : 'Expenses', icon: Wallet },
    { id: AppRoute.PAYROLL, label: language === 'ar' ? 'شؤون الموظفين' : 'HR & Payroll', icon: Users },
    { id: AppRoute.REPORTS, label: language === 'ar' ? 'التقارير' : 'Reports', icon: PieChart }, 
    { id: AppRoute.SETTINGS, label: language === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (user?.role === UserRole.OWNER) return true;
    if (item.id === AppRoute.DASHBOARD) return true;
    return user?.permissions?.includes(item.id);
  });

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-slate-900 ${language === 'ar' ? 'font-cairo' : 'font-sans'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} 
        bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 bg-slate-950">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-lg">E</div>
              <span className="font-bold text-xl tracking-wide">إنجاز</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-lg mx-auto">E</div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200
                    ${activeRoute === item.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                >
                  <item.icon size={20} />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
              {user?.name.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={onLogout} className="text-slate-400 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 z-10 relative">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
            >
              <Menu size={20} />
            </button>
            
            {/* Global Search Bar */}
            <div className="hidden md:block relative w-96" ref={searchRef}>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-full w-full border border-transparent focus-within:border-blue-500 transition-colors">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => { if(searchTerm.length >= 2) setShowResults(true); }}
                  placeholder={language === 'ar' ? "بحث شامل (فواتير، مخزون، باركود)..." : "Global Search..."}
                  className="bg-transparent border-none outline-none text-sm w-full dark:text-gray-200"
                />
                {searchTerm && (
                    <button onClick={() => { setSearchTerm(''); setShowResults(false); }} className="text-gray-400 hover:text-gray-600">
                        <span className="sr-only">Clear</span>
                        &times;
                    </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50">
                   {searchResults.length > 0 ? (
                        searchResults.map((result, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => handleNavigation(result.route)}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-700 last:border-0"
                            >
                                <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-blue-600 font-bold mb-0.5">{result.type}</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{result.title}</p>
                                    <p className="text-xs text-gray-500">{result.subtitle}</p>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                                </div>
                            </div>
                        ))
                   ) : (
                       <div className="p-6 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
                           <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-full">
                               <Frown size={24} />
                           </div>
                           <p className="text-sm font-medium">عفواً، لا توجد نتائج مطابقة لـ "{searchTerm}"</p>
                           <p className="text-xs">جرب البحث بكلمات مختلفة أو تحقق من الإملاء.</p>
                       </div>
                   )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={toggleLanguage}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 flex items-center gap-2"
              title="Change Language"
            >
              <Globe size={20} />
              <span className="text-xs font-bold">{language.toUpperCase()}</span>
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
                >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                    )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                    <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 origin-top-left animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-sm text-gray-800 dark:text-white">التنبيهات</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{notifications.length} جديد</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div key={notif.id} className="p-3 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 p-1.5 rounded-full ${notif.type === 'WARNING' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {notif.type === 'WARNING' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{notif.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                                                <span className="text-[10px] text-gray-400 mt-1 block">{notif.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">لا توجد تنبيهات جديدة</p>
                                </div>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <button className="w-full p-2 text-center text-xs text-blue-600 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium">
                                عرض كل التنبيهات
                            </button>
                        )}
                    </div>
                )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
};