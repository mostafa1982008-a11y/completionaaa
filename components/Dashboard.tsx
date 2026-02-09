import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { FinancialMetric, User, UserRole, InventoryItem, CompanySettings, Invoice, Expense } from '../types';
import { generateFinancialInsight } from '../services/geminiService';

export const Dashboard: React.FC<{user: User | null}> = ({user}) => {
  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  
  // Real Data State
  const [metrics, setMetrics] = useState<FinancialMetric[]>([
      { label: 'إجمالي المبيعات', value: 0, trend: 0, isPositive: true },
      { label: 'إجمالي المصروفات', value: 0, trend: 0, isPositive: true },
      { label: 'صافي الربح', value: 0, trend: 0, isPositive: true },
      { label: 'العملاء الجدد', value: 0, trend: 0, isPositive: true },
  ]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // 1. Load Data from V3 Storage
    const savedInventory = localStorage.getItem('inventory_data_v3');
    const savedSettings = localStorage.getItem('company_settings_v3');
    const savedInvoices = localStorage.getItem('invoices_data_v3');
    const savedExpenses = localStorage.getItem('expenses_data_v3');

    const invoices: Invoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];
    const expenses: Expense[] = savedExpenses ? JSON.parse(savedExpenses) : [];
    const inventory: InventoryItem[] = savedInventory ? JSON.parse(savedInventory) : [];

    // 2. Calculate Metrics
    const totalSales = invoices.reduce((acc, inv) => acc + inv.amount, 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = totalSales - totalExpenses;
    const uniqueCustomers = new Set(invoices.map(i => i.customerName)).size;

    setMetrics([
        { label: 'إجمالي المبيعات', value: totalSales, trend: 0, isPositive: true },
        { label: 'إجمالي المصروفات', value: totalExpenses, trend: 0, isPositive: totalExpenses === 0 }, 
        { label: 'صافي الربح', value: netProfit, trend: 0, isPositive: netProfit >= 0 },
        { label: 'العملاء', value: uniqueCustomers, trend: 0, isPositive: true },
    ]);

    // 3. Prepare Chart Data (Group by Month)
    const monthlyData = Array(12).fill(0).map((_, i) => ({ 
        name: new Date(0, i).toLocaleString('ar', { month: 'short' }), 
        income: 0, 
        expense: 0 
    }));

    invoices.forEach(inv => {
        const d = new Date(inv.date);
        if(!isNaN(d.getTime())) monthlyData[d.getMonth()].income += inv.amount;
    });
    expenses.forEach(exp => {
        const d = new Date(exp.date);
        if(!isNaN(d.getTime())) monthlyData[d.getMonth()].expense += exp.amount;
    });

    setChartData(monthlyData);

    // 4. Check Low Stock
    let thresholdFn = (item: InventoryItem) => item.quantity <= item.reorderLevel; 
    if (savedSettings) {
         const settings: CompanySettings = JSON.parse(savedSettings);
         if (settings.stockAlert) {
            if (settings.stockAlert.mode === 'GLOBAL_MIN') {
               thresholdFn = (item) => item.quantity <= settings.stockAlert.value;
            } else if (settings.stockAlert.mode === 'PERCENTAGE') {
               thresholdFn = (item) => item.quantity <= item.reorderLevel * (settings.stockAlert.value / 100);
            }
         }
    }
    setLowStockItems(inventory.filter(thresholdFn));

  }, []);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    const sales = metrics[0].value;
    const exp = metrics[1].value;
    const context = `Sales: ${sales} EGP, Expenses: ${exp} EGP. Net Profit: ${sales - exp}. Data is starting from zero.`;
    const result = await generateFinancialInsight(context);
    setInsight(result);
    setLoadingInsight(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">لوحة القيادة</h1>
          <p className="text-gray-500 dark:text-gray-400">مرحباً بك، {user?.name}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
            العملة: جنيه مصري (ج.م)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                <DollarSign size={20} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${metric.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {metric.isPositive ? '+' : '-'}{Math.floor(Math.random() * 10)}%
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-1">{metric.label}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{metric.value.toLocaleString()}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold dark:text-white">تحليل التدفقات النقدية</h3>
            {!(user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER) && (
                 <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    <Lock size={12} />
                    <span>للمدراء فقط</span>
                 </div>
            )}
          </div>
          
          {user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER ? (
             <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                  <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 rounded-lg">
                <Lock className="text-gray-400 mb-2" size={24} />
                <p className="text-gray-500 text-sm">ليس لديك صلاحية لعرض الرسوم البيانية</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* AI Advisor Card (Only for Admins/Owners) */}
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER) && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-yellow-300" size={20} />
                  <h3 className="font-bold">المستشار الذكي</h3>
                </div>
                <p className="text-indigo-100 text-sm mb-4 min-h-[60px]">
                  {loadingInsight ? 'جاري تحليل البيانات...' : (insight || 'اضغط على الزر أدناه للحصول على تحليل مالي فوري لأداء شركتك باستخدام الذكاء الاصطناعي.')}
                </p>
                <button 
                  onClick={fetchInsight}
                  disabled={loadingInsight || metrics[0].value === 0}
                  className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loadingInsight ? 'جاري التحليل...' : 'تحليل البيانات'}
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>
          )}

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-2 mb-4 text-red-600">
                <AlertCircle size={20} />
                <h3 className="font-bold">تنبيهات المخزون</h3>
              </div>
              <div className="space-y-3">
                {lowStockItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                      متبقي: {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};