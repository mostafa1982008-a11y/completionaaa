import React, { useState, useEffect, useRef } from 'react';
import { Invoice, InventoryItem, Employee, Expense, Supplier, Deduction, UserRole, User, CompanySettings, RolePermission, PaymentTransaction, StockAlertConfig, AuditLogEntry, PurchaseInvoice, PurchaseItem, ReceiptConfig, BarcodeConfig, CheckConfig, AppRoute, StockTransfer, UserSession, InventoryLocation } from '../types';
import { Search, Filter, Download, Plus, Trash2, Edit2, AlertTriangle, CheckCircle, Building2, User as UserIcon, Users, Save, FileText, X, UserPlus, Gavel, FileSpreadsheet, Printer, Moon, Sun, Globe, Bot, CreditCard, Banknote, Shield, History, ArrowDownLeft, ArrowUpRight, TrendingUp, DollarSign, RefreshCw, ToggleLeft, ToggleRight, Wallet, UserMinus, Package, Monitor, Sliders, Calculator, Briefcase, List, Link2, Link2Off, Activity, ScanBarcode, Truck, ShoppingBag, Receipt, Type, Image, FileCheck, ArrowRight, Lock, AlertOctagon, Repeat, Smartphone, MapPin, ChevronDown } from 'lucide-react';

export interface SettingsModuleProps {
    toggleTheme: () => void;
    toggleLanguage: () => void;
    theme: 'light' | 'dark';
    language: 'ar' | 'en';
    user: User | null;
    allUsers: User[];
    onCreateUser: (u: User) => void;
    onUpdateUser: (u: User) => void;
    onDeleteUser: (id: string) => void;
}

// --- Helper Functions ---
const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

const logAction = (action: string, details: string, user: User | null, module: string) => {
    try {
        const savedLog = localStorage.getItem('audit_log_v3');
        const log: AuditLogEntry[] = savedLog ? JSON.parse(savedLog) : [];
        
        const newEntry: AuditLogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action,
            details,
            performedBy: user?.name || 'Unknown',
            module
        };
        
        // Keep last 100 entries
        const updatedLog = [newEntry, ...log].slice(0, 100);
        localStorage.setItem('audit_log_v3', JSON.stringify(updatedLog));
    } catch (e) {
        console.error("Failed to log action", e);
    }
};

const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;

  const headers = Object.keys(data[0]).join(',');
  
  const rows = data.map(obj => {
      return Object.values(obj).map(val => {
          if (Array.isArray(val)) {
              if (val.length > 0 && typeof val[0] === 'object') {
                  return `"${val.map((v: any) => v.name || v.type || 'Item').join(' | ')}"`;
              }
              return `"${val.join(' | ')}"`;
          } else if (typeof val === 'object' && val !== null) {
              return `"${JSON.stringify(val).replace(/"/g, "'")}"`;
          } else if (typeof val === 'string') {
              return `"${val.replace(/"/g, '""')}"`;
          }
          return `"${val}"`;
      }).join(',');
  }).join('\n');

  const csvContent = "data:text/csv;charset=utf-8," + `\uFEFF${headers}\n${rows}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const printInvoice = (inv: Invoice) => {
  const savedSettings = localStorage.getItem('company_settings_v3');
  const settings: CompanySettings = savedSettings ? JSON.parse(savedSettings) : null;
  
  const receiptConfig: ReceiptConfig = settings?.receiptConfig || {
      showLogo: false,
      headerText: 'إنجاز للحلول المتكاملة',
      footerText: 'شكراً لتعاملكم معنا',
      showTaxId: true,
      fontSize: 'medium'
  };

  const companyName = settings?.name || 'شركة إنجاز';
  const logoUrl = settings?.receiptConfig?.logoUrl;

  const fontSizes = {
      small: '10px',
      medium: '12px',
      large: '14px'
  };

  const fontSize = fontSizes[receiptConfig.fontSize] || '12px';
  const lateFees = inv.lateFees || 0;
  const grandTotal = inv.amount + lateFees;

  const printWindow = window.open('', '', 'height=600,width=400');
  if (printWindow) {
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة ${inv.number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { 
                font-family: 'Cairo', sans-serif; 
                padding: 10px; 
                margin: 0;
                width: 80mm; /* Standard Thermal Paper Width */
                font-size: ${fontSize};
                color: #000;
            }
            .container {
                width: 100%;
                text-align: center;
            }
            .header { 
                margin-bottom: 10px; 
                border-bottom: 2px dashed #000; 
                padding-bottom: 10px; 
            }
            .logo-img {
                max-width: 80px;
                max-height: 80px;
                margin: 0 auto 5px auto;
                display: block;
            }
            .logo-placeholder {
                width: 60px;
                height: 60px;
                background-color: #eee;
                border-radius: 50%;
                margin: 0 auto 10px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 20px;
            }
            h1 { font-size: 1.2em; margin: 5px 0; }
            p { margin: 2px 0; }
            .details { text-align: right; margin: 10px 0; font-size: 0.9em; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
            th { border-bottom: 1px solid #000; padding: 4px; text-align: right; font-size: 0.9em; }
            td { padding: 4px; text-align: right; font-size: 0.9em; }
            .total-row { border-top: 2px dashed #000; font-weight: bold; font-size: 1.1em; }
            .footer { 
                margin-top: 20px; 
                text-align: center; 
                font-size: 0.8em; 
                border-top: 1px dotted #000; 
                padding-top: 5px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${receiptConfig.showLogo && logoUrl ? `<img src="${logoUrl}" class="logo-img" />` : (!receiptConfig.showLogo ? '' : '<div class="logo-placeholder">E</div>')}
              <h1>${companyName}</h1>
              ${receiptConfig.headerText ? `<p>${receiptConfig.headerText}</p>` : ''}
              ${receiptConfig.showTaxId ? `<p>رقم ضريبي: 3000556677</p>` : ''}
            </div>
            
            <div class="details">
              <p><strong>رقم الفاتورة:</strong> ${inv.number}</p>
              <p><strong>التاريخ:</strong> ${inv.date} ${new Date().toLocaleTimeString('ar-EG')}</p>
              <p><strong>العميل:</strong> ${inv.customerName}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>المجموع</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>مشتريات عامة</td>
                  <td>${inv.items}</td>
                  <td>-</td>
                  <td>${inv.amount.toLocaleString()}</td>
                </tr>
                ${lateFees > 0 ? `
                <tr>
                  <td colspan="3">رسوم تأخير / إضافية</td>
                  <td>${lateFees.toLocaleString()}</td>
                </tr>` : ''}
              </tbody>
              <tfoot>
                 <tr>
                    <td colspan="4" class="total-row" style="padding-top: 10px;">
                        الإجمالي: ${grandTotal.toLocaleString()} ج.م
                    </td>
                 </tr>
              </tfoot>
            </table>

            <div class="footer">
              <p>${receiptConfig.footerText}</p>
              <p>نظام إنجاز المحاسبي</p>
            </div>
          </div>
          <script>
             window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

const printBarcode = (item: Partial<InventoryItem>) => {
  const savedSettings = localStorage.getItem('company_settings_v3');
  const settings: CompanySettings = savedSettings ? JSON.parse(savedSettings) : null;
  const config = settings?.barcodeConfig || { height: 40, width: 2, showName: true, showPrice: true, fontSize: 14 };

  const displayBarcode = item.barcode || item.sku || 'UNKNOWN';
  const displayName = item.name || 'Unknown Item';
  const displayPrice = item.unitPrice || 0;

  const printWindow = window.open('', '', 'height=400,width=600');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode - ${displayName}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600&display=swap');
            body { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                font-family: 'Cairo', sans-serif; 
            }
            .label { 
                text-align: center; 
                border: 1px dashed #ccc; 
                padding: 10px; 
                border-radius: 4px; 
            }
            h2 { margin: 0 0 5px 0; font-size: 14px; }
            .price { font-size: 16px; font-weight: bold; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="label">
            ${config.showName ? `<h2>${displayName}</h2>` : ''}
            <svg id="barcode"></svg>
            ${config.showPrice ? `<div class="price">${displayPrice.toLocaleString()} ج.م</div>` : ''}
          </div>
          <script>
            window.onload = function() {
              try {
                JsBarcode("#barcode", "${displayBarcode}", {
                  format: "CODE128",
                  lineColor: "#000",
                  width: ${config.width},
                  height: ${config.height},
                  displayValue: true,
                  fontSize: ${config.fontSize},
                  margin: 5
                });
                setTimeout(() => window.print(), 500);
              } catch (e) {
                document.body.innerHTML = "Error generating barcode: " + e.message;
              }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

const ModuleHeader: React.FC<{ title: string; onAdd?: () => void; addLabel?: string; onExport?: () => void; onPrint?: () => void; printLabel?: string; extraActions?: React.ReactNode }> = ({ title, onAdd, addLabel, onExport, onPrint, printLabel, extraActions }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      {extraActions}
      {onPrint && (
        <button
          onClick={onPrint}
          className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Printer size={18} />
          <span>{printLabel || 'طباعة'}</span>
        </button>
      )}
      {onExport && (
        <button 
          onClick={onExport}
          className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <FileSpreadsheet size={18} />
          <span>تصدير Excel</span>
        </button>
      )}
      {onAdd && (
        <button 
          onClick={onAdd}
          className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>{addLabel || 'جديد'}</span>
        </button>
      )}
    </div>
  </div>
);

const SearchBar: React.FC<{ placeholder: string, onChange?: (val: string) => void, children?: React.ReactNode }> = ({ placeholder, onChange, children }) => (
  <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap gap-4 justify-between bg-white dark:bg-slate-800 rounded-t-xl items-center">
    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-lg w-full md:w-96 border border-gray-200 dark:border-slate-700">
      <Search size={18} className="text-gray-400" />
      <input 
        type="text" 
        placeholder={placeholder} 
        className="bg-transparent border-none outline-none w-full text-sm dark:text-gray-200" 
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
    {children}
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
        <h3 className="text-xl font-bold dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-red-500 bg-gray-100 dark:bg-slate-700 p-1 rounded-full">
          <X size={20} />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

// --- SALES MODULE ---
// ... (SalesModule remains unchanged)
interface SalesLineItem {
    id: string;
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export const SalesModule: React.FC<{user: User | null}> = ({user}) => {
  const [invoices, setInvoices] = usePersistentState<Invoice[]>('invoices_data_v3', []);
  const [inventory] = usePersistentState<InventoryItem[]>('inventory_data_v3', []);
  const [showModal, setShowModal] = useState(false);
  const [newInv, setNewInv] = useState({ customer: '', lateFees: 0 });
  const [lineItems, setLineItems] = useState<SalesLineItem[]>([]);
  const [currentLineItem, setCurrentLineItem] = useState<{itemId: string, name: string, quantity: number, unitPrice: number}>({ itemId: '', name: '', quantity: 1, unitPrice: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionConfirmation, setActionConfirmation] = useState<{
      type: 'DELETE' | 'TOGGLE_STATUS';
      invoiceId: string;
      isOpen: boolean;
  }>({ type: 'TOGGLE_STATUS', invoiceId: '', isOpen: false });
  const [actionReason, setActionReason] = useState('');

  const itemsTotal = lineItems.reduce((acc, item) => acc + item.total, 0);
  const grandTotal = itemsTotal + (newInv.lateFees || 0);

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = e.target.value;
      if (!selectedId) {
          setCurrentLineItem({ itemId: '', name: '', quantity: 1, unitPrice: 0 });
          return;
      }
      const item = inventory.find(i => i.id === selectedId);
      if (item) {
          setCurrentLineItem({
              itemId: item.id,
              name: item.name,
              quantity: 1,
              unitPrice: item.unitPrice
          });
      }
  };

  const handleAddLineItem = () => {
      if (!currentLineItem.itemId || currentLineItem.quantity <= 0 || currentLineItem.unitPrice < 0) return;
      const newItem: SalesLineItem = {
          id: Date.now().toString(),
          itemId: currentLineItem.itemId,
          name: currentLineItem.name,
          quantity: currentLineItem.quantity,
          unitPrice: currentLineItem.unitPrice,
          total: currentLineItem.quantity * currentLineItem.unitPrice
      };
      setLineItems([...lineItems, newItem]);
      setCurrentLineItem({ itemId: '', name: '', quantity: 1, unitPrice: 0 }); 
  };

  const handleRemoveLineItem = (id: string) => {
      setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleSave = () => {
    if (lineItems.length === 0) {
        alert("الرجاء إضافة صنف واحد على الأقل للفاتورة");
        return;
    }
    const inv: Invoice = {
      id: Date.now().toString(),
      number: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      customerName: newInv.customer || 'عميل نقدي',
      date: new Date().toISOString().split('T')[0],
      amount: itemsTotal,
      lateFees: newInv.lateFees,
      status: 'PENDING',
      items: lineItems.length
    };
    setInvoices([inv, ...invoices]);
    logAction('CREATE_INVOICE', `Created invoice ${inv.number} for ${inv.customerName} amount ${grandTotal}`, user, 'SALES');
    setShowModal(false);
    setNewInv({ customer: '', lateFees: 0 });
    setLineItems([]);
  };

  const initiateStatusToggle = (id: string) => {
      setActionConfirmation({ type: 'TOGGLE_STATUS', invoiceId: id, isOpen: true });
      setActionReason('');
  };

  const initiateDelete = (id: string) => {
      setActionConfirmation({ type: 'DELETE', invoiceId: id, isOpen: true });
      setActionReason('');
  };

  const confirmAction = () => {
      if (!actionReason.trim()) {
          alert("الرجاء ذكر سبب الإجراء للتوثيق.");
          return;
      }
      const { type, invoiceId } = actionConfirmation;
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return;

      if (type === 'DELETE') {
          setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
          logAction('DELETE_INVOICE', `Deleted invoice ${invoice.number}. Reason: ${actionReason}`, user, 'SALES');
      } else if (type === 'TOGGLE_STATUS') {
          const newStatus = invoice.status === 'PAID' ? 'PENDING' : 'PAID';
          setInvoices(prev => prev.map(inv => {
              if (inv.id === invoiceId) {
                  return { ...inv, status: newStatus };
              }
              return inv;
          }));
          logAction('UPDATE_INVOICE_STATUS', `Changed invoice ${invoice.number} status to ${newStatus}. Reason: ${actionReason}`, user, 'SALES');
      }
      setActionConfirmation({ ...actionConfirmation, isOpen: false });
      setActionReason('');
  };

  const filteredInvoices = invoices.filter(inv => {
      const matchSearch = inv.number.includes(searchTerm) || inv.customerName.includes(searchTerm);
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
      return matchSearch && matchStatus && matchDate;
  });

  return (
    <div>
      <ModuleHeader title="إدارة المبيعات" onAdd={() => setShowModal(true)} addLabel="فاتورة جديدة" onExport={() => exportToCSV(filteredInvoices, 'sales_report')} />
      {actionConfirmation.isOpen && (
          <Modal title={actionConfirmation.type === 'DELETE' ? 'تأكيد حذف الفاتورة' : 'تأكيد تعديل حالة الفاتورة'} onClose={() => setActionConfirmation({ ...actionConfirmation, isOpen: false })}>
              <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200">
                      <AlertTriangle size={24} />
                      <p className="text-sm">{actionConfirmation.type === 'DELETE' ? 'هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.' : 'أنت على وشك تعديل حالة فاتورة مسجلة مسبقاً. هذا الإجراء يتطلب توثيق السبب.'}</p>
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">سبب الإجراء (مطلوب للتوثيق)</label>
                      <textarea className="w-full p-3 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="مثال: خطأ في الإدخال، مرتجع، إلخ..." value={actionReason} onChange={(e) => setActionReason(e.target.value)}/>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setActionConfirmation({ ...actionConfirmation, isOpen: false })} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">إلغاء</button>
                      <button onClick={confirmAction} className={`px-6 py-2 text-white rounded-lg transition-colors ${actionConfirmation.type === 'DELETE' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{actionConfirmation.type === 'DELETE' ? 'حذف نهائي' : 'تأكيد التعديل'}</button>
                  </div>
              </div>
          </Modal>
      )}
      {showModal && (
        <Modal title="فاتورة مبيعات جديدة" onClose={() => setShowModal(false)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">العميل</label><input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="اسم العميل (افتراضي: نقدي)" value={newInv.customer} onChange={e => setNewInv({...newInv, customer: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">التاريخ</label><input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                  <h4 className="font-bold text-sm mb-3 dark:text-white flex items-center gap-2"><Plus size={16}/> إضافة صنف</h4>
                  <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                          <label className="block text-xs mb-1 text-gray-500">بحث عن صنف</label>
                          <select 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
                            value={currentLineItem.itemId}
                            onChange={handleItemSelect}
                          >
                              <option value="">اختر صنف...</option>
                              {inventory.map(item => (
                                  <option key={item.id} value={item.id}>{item.name} - {item.unitPrice} ج.م</option>
                              ))}
                          </select>
                      </div>
                      <div className="col-span-3">
                          <label className="block text-xs mb-1 text-gray-500">السعر (تلقائي)</label>
                          <input 
                            type="number" 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm" 
                            value={currentLineItem.unitPrice} 
                            onChange={e => setCurrentLineItem({...currentLineItem, unitPrice: Number(e.target.value)})}
                          />
                      </div>
                      <div className="col-span-2">
                          <label className="block text-xs mb-1 text-gray-500">الكمية</label>
                          <input 
                            type="number" 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm" 
                            value={currentLineItem.quantity} 
                            onChange={e => setCurrentLineItem({...currentLineItem, quantity: Number(e.target.value)})}
                          />
                      </div>
                      <div className="col-span-2">
                          <button 
                            onClick={handleAddLineItem}
                            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
                          >
                              إضافة
                          </button>
                      </div>
                  </div>
              </div>
              <div className="border rounded-lg overflow-hidden dark:border-slate-700 max-h-40 overflow-y-auto">
                  <table className="w-full text-right text-sm">
                      <thead className="bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-300 sticky top-0">
                          <tr><th className="p-2">الصنف</th><th className="p-2">السعر</th><th className="p-2">الكمية</th><th className="p-2">الإجمالي</th><th className="p-2"></th></tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-700 text-gray-700 dark:text-gray-200">
                          {lineItems.length === 0 ? (
                              <tr><td colSpan={5} className="p-4 text-center text-gray-400">لا توجد أصناف مضافة</td></tr>
                          ) : (
                              lineItems.map(item => (
                                  <tr key={item.id}>
                                      <td className="p-2">{item.name}</td>
                                      <td className="p-2">{item.unitPrice}</td>
                                      <td className="p-2">{item.quantity}</td>
                                      <td className="p-2 font-bold">{item.total.toLocaleString()}</td>
                                      <td className="p-2 text-center"><button onClick={() => handleRemoveLineItem(item.id)} className="text-red-500 hover:bg-red-50 rounded p-1"><X size={14}/></button></td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 pt-4 bg-gray-50/50 dark:bg-slate-900/30 p-4 rounded-lg">
                 <div className="grid grid-cols-2 gap-4 items-center">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">رسوم إضافية / تأخير</label>
                        <input type="number" placeholder="0.00" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={newInv.lateFees} onChange={e => setNewInv({...newInv, lateFees: Number(e.target.value)})} />
                    </div>
                    <div className="text-left">
                        <p className="text-sm text-gray-500">إجمالي الأصناف: <span className="font-bold text-gray-800 dark:text-white">{itemsTotal.toLocaleString()} ج.م</span></p>
                        <p className="text-xl font-bold text-blue-600 mt-1">الإجمالي النهائي: {grandTotal.toLocaleString()} ج.م</p>
                    </div>
                 </div>
              </div>
              <div className="flex justify-end pt-2 gap-2"><button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">إلغاء</button><button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">حفظ الفاتورة</button></div>
            </div>
        </Modal>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <SearchBar placeholder="بحث برقم الفاتورة أو اسم العميل..." onChange={setSearchTerm}>
            <div className="flex flex-wrap gap-2 items-center">
                <input type="date" className="p-2 border rounded text-xs dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
                <span className="text-gray-400">-</span>
                <input type="date" className="p-2 border rounded text-xs dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
                <select className="p-2 border rounded text-xs dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">الكل</option><option value="PAID">مدفوع</option><option value="PENDING">معلق</option></select>
            </div>
        </SearchBar>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-sm"><tr><th className="px-6 py-4 font-medium">رقم الفاتورة</th><th className="px-6 py-4 font-medium">العميل</th><th className="px-6 py-4 font-medium">التاريخ</th><th className="px-6 py-4 font-medium">المبلغ</th><th className="px-6 py-4 font-medium">الحالة</th><th className="px-6 py-4 font-medium">إجراءات</th></tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-sm text-gray-700 dark:text-gray-300">
              {filteredInvoices.length === 0 ? (<tr><td colSpan={6} className="text-center py-8 text-gray-400">لا توجد فواتير مبيعات مطابقة</td></tr>) : (filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium">{inv.number}</td>
                  <td className="px-6 py-4 font-semibold">{inv.customerName}</td>
                  <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                  <td className="px-6 py-4 font-bold">{(inv.amount + (inv.lateFees || 0)).toLocaleString()} ج.م {inv.lateFees && inv.lateFees > 0 && <span className="block text-xs text-red-500 font-normal">+(رسوم: {inv.lateFees})</span>}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status === 'PAID' ? 'مدفوعة' : 'معلقة'}</span></td>
                  <td className="px-6 py-4 flex gap-2">
                     <button onClick={() => printInvoice(inv)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="طباعة PDF"><Printer size={18} /></button>
                     <button onClick={() => initiateStatusToggle(inv.id)} className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded" title={inv.status === 'PAID' ? 'تحويل إلى معلقة' : 'تحويل إلى مدفوعة'}><RefreshCw size={18} /></button>
                     <button onClick={() => initiateDelete(inv.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="حذف الفاتورة"><Trash2 size={18} /></button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- PURCHASES MODULE ---
export const PurchasesModule: React.FC<{user: User | null}> = ({user}) => {
    const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('suppliers_data_v3', []);
    // Using the new key for payment history as requested
    const [payments, setPayments] = usePersistentState<PaymentTransaction[]>('supplier_payment_history_v3', []);
    
    const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'PAYMENTS'>('SUPPLIERS');

    // Supplier State
    const [showModal, setShowModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState<Supplier>({ id: '', name: '', contact: '', balance: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [newPayment, setNewPayment] = useState<{
        supplierId: string;
        amount: number;
        date: string;
        method: 'CASH' | 'VISA' | 'CHEQUE';
        reference: string;
    }>({ supplierId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'CASH', reference: '' });

    const handleSaveSupplier = () => {
        const supplier = { ...newSupplier, id: Date.now().toString() };
        setSuppliers([...suppliers, supplier]);
        setShowModal(false);
        setNewSupplier({ id: '', name: '', contact: '', balance: 0 });
        logAction('ADD_SUPPLIER', `Added supplier ${supplier.name}`, user, 'PURCHASES');
    };

    const handleSavePayment = () => {
        if (!newPayment.supplierId || newPayment.amount <= 0) return;
        const supplier = suppliers.find(s => s.id === newPayment.supplierId);
        if (!supplier) return;

        const payment: PaymentTransaction = {
            id: Date.now().toString(),
            supplierId: supplier.id,
            supplierName: supplier.name,
            date: newPayment.date,
            amount: newPayment.amount,
            type: 'PAYMENT',
            method: newPayment.method,
            reference: newPayment.reference,
            previousBalance: supplier.balance // Store previous balance
        };

        setPayments([payment, ...payments]);
        // Update Supplier Balance (Reduce balance when paid)
        setSuppliers(suppliers.map(s => s.id === supplier.id ? { ...s, balance: s.balance - newPayment.amount } : s));
        
        setShowPaymentModal(false);
        setNewPayment({ supplierId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'CASH', reference: '' });
        logAction('ADD_PAYMENT', `Paid ${payment.amount} to ${supplier.name}`, user, 'PURCHASES');
    };

    const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 mb-6">
                <button onClick={() => setActiveTab('SUPPLIERS')} className={`pb-2 px-4 ${activeTab === 'SUPPLIERS' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}>الموردين</button>
                <button onClick={() => setActiveTab('PAYMENTS')} className={`pb-2 px-4 ${activeTab === 'PAYMENTS' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}>مدفوعات الموردين</button>
            </div>

            {activeTab === 'SUPPLIERS' && (
                <>
                    <ModuleHeader title="إدارة الموردين" onAdd={() => setShowModal(true)} addLabel="إضافة مورد" onExport={() => exportToCSV(suppliers, 'suppliers_list')} />
                    {showModal && (
                        <Modal title="إضافة مورد جديد" onClose={() => setShowModal(false)}>
                            <div className="space-y-4">
                                <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="اسم المورد" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                                <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="معلومات الاتصال" value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} />
                                <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" type="number" placeholder="الرصيد الافتتاحي" value={newSupplier.balance} onChange={e => setNewSupplier({...newSupplier, balance: Number(e.target.value)})} />
                                <button onClick={handleSaveSupplier} className="w-full py-2 bg-blue-600 text-white rounded">حفظ</button>
                            </div>
                        </Modal>
                    )}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <SearchBar placeholder="بحث عن مورد..." onChange={setSearchTerm} />
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 dark:bg-slate-900 text-sm text-gray-500"><tr><th className="px-6 py-3">الاسم</th><th className="px-6 py-3">الاتصال</th><th className="px-6 py-3">الرصيد المستحق</th></tr></thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 dark:text-gray-300">
                                {filteredSuppliers.map(s => (
                                    <tr key={s.id}>
                                        <td className="px-6 py-3">{s.name}</td>
                                        <td className="px-6 py-3">{s.contact}</td>
                                        <td className="px-6 py-3 font-bold text-red-600">{s.balance} ج.م</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'PAYMENTS' && (
                <>
                    <ModuleHeader title="سجل المدفوعات" onAdd={() => setShowPaymentModal(true)} addLabel="تسجيل دفعة" onExport={() => exportToCSV(payments, 'supplier_payments')} />
                    {showPaymentModal && (
                        <Modal title="تسجيل دفعة لمورد" onClose={() => setShowPaymentModal(false)}>
                            <div className="space-y-4">
                                <select 
                                    className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    value={newPayment.supplierId}
                                    onChange={e => setNewPayment({...newPayment, supplierId: e.target.value})}
                                >
                                    <option value="">اختر المورد</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (رصيد: {s.balance})</option>)}
                                </select>
                                <input type="number" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="المبلغ المدفوع" value={newPayment.amount || ''} onChange={e => setNewPayment({...newPayment, amount: Number(e.target.value)})} />
                                <input type="date" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} />
                                <select 
                                    className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    value={newPayment.method}
                                    onChange={e => setNewPayment({...newPayment, method: e.target.value as any})}
                                >
                                    <option value="CASH">نقدي (Cash)</option>
                                    <option value="VISA">فيزا (Visa)</option>
                                    <option value="CHEQUE">شيك (Cheque)</option>
                                </select>
                                {newPayment.method !== 'CASH' && (
                                    <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="رقم المرجع / الشيك" value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} />
                                )}
                                <button onClick={handleSavePayment} className="w-full py-2 bg-green-600 text-white rounded">تسجيل الدفع</button>
                            </div>
                        </Modal>
                    )}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 dark:bg-slate-900 text-sm text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">التاريخ</th>
                                    <th className="px-6 py-3">المورد</th>
                                    <th className="px-6 py-3">المبلغ</th>
                                    <th className="px-6 py-3">الرصيد السابق</th>
                                    <th className="px-6 py-3">طريقة الدفع</th>
                                    <th className="px-6 py-3">مرجع</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 dark:text-gray-300">
                                {payments.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-3">{p.date}</td>
                                        <td className="px-6 py-3">{p.supplierName}</td>
                                        <td className="px-6 py-3 font-bold text-green-600">{p.amount} ج.م</td>
                                        <td className="px-6 py-3 text-gray-500">{p.previousBalance !== undefined ? `${p.previousBalance} ج.م` : '-'}</td>
                                        <td className="px-6 py-3 text-xs">
                                            <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{p.method}</span>
                                        </td>
                                        <td className="px-6 py-3 font-mono text-xs">{p.reference || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

// --- INVENTORY MODULE ---
// ... (InventoryModule remains unchanged)
export const InventoryModule: React.FC<{user: User | null}> = ({user}) => {
    const [inventory, setInventory] = usePersistentState<InventoryItem[]>('inventory_data_v3', []);
    const [transfers, setTransfers] = usePersistentState<StockTransfer[]>('stock_transfers_v3', []);
    const [locations, setLocations] = usePersistentState<InventoryLocation[]>('inventory_locations_v3', [
        { id: '1', name: 'المخزن الرئيسي', type: 'WAREHOUSE' }
    ]);
    const [activeTab, setActiveTab] = useState<'ITEMS' | 'TRANSFERS' | 'LOCATIONS'>('ITEMS');
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ location: 'المخزن الرئيسي' });
    const [searchTerm, setSearchTerm] = useState('');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferData, setTransferData] = useState({ itemId: '', toLocation: '', quantity: 0 });
    const [newLocation, setNewLocation] = useState<Partial<InventoryLocation>>({ type: 'BRANCH' });
    const [showLocationModal, setShowLocationModal] = useState(false);

    const handleSaveItem = () => {
        const item: InventoryItem = {
            id: newItem.id || Date.now().toString(),
            name: newItem.name || '',
            sku: newItem.sku || `SKU-${Date.now()}`,
            quantity: Number(newItem.quantity) || 0,
            unitPrice: Number(newItem.unitPrice) || 0,
            reorderLevel: Number(newItem.reorderLevel) || 10,
            unit: newItem.unit || 'قطعة',
            category: newItem.category || 'عام',
            barcode: newItem.barcode || '',
            location: newItem.location || 'المخزن الرئيسي'
        };
        if (newItem.id) {
             setInventory(inventory.map(i => i.id === newItem.id ? item : i));
        } else {
             setInventory([...inventory, item]);
        }
        setShowModal(false);
        setNewItem({ location: 'المخزن الرئيسي' });
        logAction(newItem.id ? 'UPDATE_INVENTORY' : 'ADD_INVENTORY', `Saved item ${item.name}`, user, 'INVENTORY');
    };

    const handleSaveLocation = () => {
        if (!newLocation.name) return;
        const loc: InventoryLocation = {
            id: Date.now().toString(),
            name: newLocation.name,
            address: newLocation.address || '',
            type: newLocation.type || 'BRANCH'
        };
        setLocations([...locations, loc]);
        setShowLocationModal(false);
        setNewLocation({ type: 'BRANCH' });
    };

    const handleTransfer = () => {
        const item = inventory.find(i => i.id === transferData.itemId);
        if (!item || transferData.quantity <= 0 || !transferData.toLocation) return;
        if (item.quantity < transferData.quantity) {
            alert("الكمية غير كافية في المخزن الحالي");
            return;
        }
        const existingDestItem = inventory.find(i => i.sku === item.sku && i.location === transferData.toLocation);
        let newInventory = inventory.map(i => {
            if (i.id === item.id) {
                return { ...i, quantity: i.quantity - transferData.quantity };
            }
            return i;
        });
        if (existingDestItem) {
            newInventory = newInventory.map(i => {
                if (i.id === existingDestItem.id) {
                    return { ...i, quantity: i.quantity + transferData.quantity };
                }
                return i;
            });
        } else {
            const newItemEntry: InventoryItem = {
                ...item,
                id: Date.now().toString(),
                location: transferData.toLocation,
                quantity: transferData.quantity
            };
            newInventory.push(newItemEntry);
        }
        setInventory(newInventory);
        const transferRecord: StockTransfer = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            itemId: item.id,
            itemName: item.name,
            fromLocation: item.location || 'Unknown',
            toLocation: transferData.toLocation,
            quantity: transferData.quantity,
            approvedBy: user?.name || 'System'
        };
        setTransfers([transferRecord, ...transfers]);
        setShowTransferModal(false);
        setTransferData({ itemId: '', toLocation: '', quantity: 0 });
        logAction('TRANSFER_STOCK', `Moved ${transferRecord.quantity} of ${item.name} to ${transferRecord.toLocation}`, user, 'INVENTORY');
    };

    const filteredItems = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 mb-6">
                <button onClick={() => setActiveTab('ITEMS')} className={`pb-2 px-4 ${activeTab === 'ITEMS' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}>الأصناف</button>
                <button onClick={() => setActiveTab('LOCATIONS')} className={`pb-2 px-4 ${activeTab === 'LOCATIONS' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}>الفروع والمخازن</button>
                <button onClick={() => setActiveTab('TRANSFERS')} className={`pb-2 px-4 ${activeTab === 'TRANSFERS' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}>نقل مخزني</button>
            </div>
            {activeTab === 'ITEMS' && (
                <>
                    <ModuleHeader 
                        title="إدارة المخزون" 
                        onAdd={() => { setNewItem({ location: 'المخزن الرئيسي' }); setShowModal(true); }} 
                        addLabel="إضافة صنف" 
                        onExport={() => exportToCSV(inventory, 'inventory_stock')} 
                        extraActions={
                            <button onClick={() => setShowTransferModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm">
                                <Repeat size={18} />
                                <span>نقل مخزون</span>
                            </button>
                        }
                    />
                    {showModal && (
                        <Modal title={newItem.id ? "تعديل صنف" : "إضافة صنف جديد"} onClose={() => setShowModal(false)}>
                            <div className="space-y-4">
                                <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="اسم الصنف" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="السعر" type="number" value={newItem.unitPrice || ''} onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})} />
                                    <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="الكمية" type="number" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label className="block text-xs mb-1 text-gray-500">الباركود (قابل للتعديل)</label>
                                        <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white bg-yellow-50 dark:bg-yellow-900/10" placeholder="باركود" value={newItem.barcode || ''} onChange={e => setNewItem({...newItem, barcode: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">الموقع / المخزن</label>
                                        <select 
                                            className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                            value={newItem.location || ''}
                                            onChange={e => setNewItem({...newItem, location: e.target.value})}
                                        >
                                            {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleSaveItem} className="w-full py-2 bg-blue-600 text-white rounded">حفظ</button>
                            </div>
                        </Modal>
                    )}
                    {showTransferModal && (
                        <Modal title="نقل مخزون بين الفروع" onClose={() => setShowTransferModal(false)}>
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-sm mb-1 text-gray-500">اختر الصنف (من المخزن الحالي)</label>
                                    <select 
                                        className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        value={transferData.itemId}
                                        onChange={e => setTransferData({...transferData, itemId: e.target.value})}
                                    >
                                        <option value="">اختر الصنف...</option>
                                        {inventory.filter(i => i.quantity > 0).map(i => (
                                            <option key={i.id} value={i.id}>{i.name} - {i.location} (Available: {i.quantity})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 text-gray-500">إلى المخزن / الفرع</label>
                                    <select
                                        className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        value={transferData.toLocation}
                                        onChange={e => setTransferData({...transferData, toLocation: e.target.value})}
                                    >
                                        <option value="">اختر الوجهة...</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.name}>{loc.name} ({loc.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 text-gray-500">الكمية المراد نقلها</label>
                                    <input 
                                        type="number"
                                        className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        value={transferData.quantity || ''}
                                        onChange={e => setTransferData({...transferData, quantity: Number(e.target.value)})}
                                    />
                                </div>
                                <button onClick={handleTransfer} className="w-full py-2 bg-orange-600 text-white rounded">إتمام النقل</button>
                             </div>
                        </Modal>
                    )}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <SearchBar placeholder="بحث في المخزون..." onChange={setSearchTerm} />
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 dark:bg-slate-900 text-sm text-gray-500">
                                <tr><th className="px-6 py-3">الصنف</th><th className="px-6 py-3">الموقع</th><th className="px-6 py-3">الباركود</th><th className="px-6 py-3">الكمية</th><th className="px-6 py-3">السعر</th><th className="px-6 py-3">إجراءات</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 dark:text-gray-300">
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-3">{item.name}</td>
                                        <td className="px-6 py-3 text-xs"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">{item.location || 'N/A'}</span></td>
                                        <td className="px-6 py-3 font-mono text-xs">{item.barcode}</td>
                                        <td className="px-6 py-3">{item.quantity}</td>
                                        <td className="px-6 py-3">{item.unitPrice}</td>
                                        <td className="px-6 py-3 flex gap-2">
                                            <button onClick={() => printBarcode(item)} className="text-blue-600 hover:text-blue-800" title="طباعة باركود"><Printer size={16} /></button>
                                            <button onClick={() => { setNewItem(item); setShowModal(true); }} className="text-green-600 hover:text-green-800" title="تعديل"><Edit2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {activeTab === 'LOCATIONS' && (
                <>
                    <ModuleHeader title="إدارة الفروع والمخازن" onAdd={() => setShowLocationModal(true)} addLabel="إضافة فرع/مخزن" />
                    {showLocationModal && (
                        <Modal title="إضافة موقع جديد" onClose={() => setShowLocationModal(false)}>
                            <div className="space-y-4">
                                <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="اسم الموقع (مثل: الفرع الرئيسي)" value={newLocation.name || ''} onChange={e => setNewLocation({...newLocation, name: e.target.value})} />
                                <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="العنوان / ملاحظات" value={newLocation.address || ''} onChange={e => setNewLocation({...newLocation, address: e.target.value})} />
                                <select className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={newLocation.type} onChange={e => setNewLocation({...newLocation, type: e.target.value as any})}>
                                    <option value="STORE">محل تجاري (Store)</option>
                                    <option value="WAREHOUSE">مخزن (Warehouse)</option>
                                    <option value="BRANCH">فرع (Branch)</option>
                                </select>
                                <button onClick={handleSaveLocation} className="w-full py-2 bg-blue-600 text-white rounded">إضافة</button>
                            </div>
                        </Modal>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {locations.map(loc => (
                            <div key={loc.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                                            {loc.type === 'WAREHOUSE' ? <Building2 size={20} /> : <ShoppingBag size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-white">{loc.name}</h4>
                                            <p className="text-xs text-gray-500">{loc.type}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { if (loc.id === '1') { alert('لا يمكن حذف المخزن الرئيسي'); return; } setLocations(locations.filter(l => l.id !== loc.id)); }} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                                {loc.address && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1"><MapPin size={14}/> {loc.address}</p>}
                            </div>
                        ))}
                    </div>
                </>
            )}
            {activeTab === 'TRANSFERS' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="p-4 border-b dark:border-slate-700"><h3 className="font-bold dark:text-white">سجل حركات النقل</h3></div>
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 dark:bg-slate-900 text-sm text-gray-500">
                            <tr><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">الصنف</th><th className="px-6 py-3">من</th><th className="px-6 py-3">إلى</th><th className="px-6 py-3">الكمية</th><th className="px-6 py-3">المسؤول</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 dark:text-gray-300">
                            {transfers.map(t => (
                                <tr key={t.id}>
                                    <td className="px-6 py-3">{t.date}</td>
                                    <td className="px-6 py-3">{t.itemName}</td>
                                    <td className="px-6 py-3">{t.fromLocation}</td>
                                    <td className="px-6 py-3 text-green-600 font-bold"> &rarr; {t.toLocation}</td>
                                    <td className="px-6 py-3 font-bold">{t.quantity}</td>
                                    <td className="px-6 py-3 text-xs">{t.approvedBy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- EXPENSES MODULE ---
// ... (ExpensesModule remains unchanged)
export const ExpensesModule: React.FC<{user: User | null}> = ({user}) => {
    const [expenses, setExpenses] = usePersistentState<Expense[]>('expenses_data_v3', []);
    const [showModal, setShowModal] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({});

    const handleSave = () => {
        const expense: Expense = {
            id: Date.now().toString(),
            category: newExpense.category || 'عام',
            description: newExpense.description || '',
            amount: Number(newExpense.amount) || 0,
            date: newExpense.date || new Date().toISOString().split('T')[0],
            approvedBy: user?.name || ''
        };
        setExpenses([...expenses, expense]);
        setShowModal(false);
        setNewExpense({});
        logAction('ADD_EXPENSE', `Added expense ${expense.amount} for ${expense.description}`, user, 'EXPENSES');
    };

    return (
        <div>
            <ModuleHeader title="المصروفات" onAdd={() => setShowModal(true)} addLabel="تسجيل مصروف" onExport={() => exportToCSV(expenses, 'expenses_report')} />
            {showModal && (
                <Modal title="تسجيل مصروف جديد" onClose={() => setShowModal(false)}>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="الوصف" value={newExpense.description || ''} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                        <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="المبلغ" type="number" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                        <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="التصنيف" value={newExpense.category || ''} onChange={e => setNewExpense({...newExpense, category: e.target.value})} />
                         <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" type="date" value={newExpense.date || ''} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                        <button onClick={handleSave} className="w-full py-2 bg-blue-600 text-white rounded">حفظ</button>
                    </div>
                </Modal>
            )}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
                 <table className="w-full text-right">
                    <thead className="bg-gray-50 dark:bg-slate-900 text-sm text-gray-500"><tr><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">الوصف</th><th className="px-6 py-3">المبلغ</th><th className="px-6 py-3">الموافقة</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700 dark:text-gray-300">
                        {expenses.map(e => (
                            <tr key={e.id}>
                                <td className="px-6 py-3">{e.date}</td>
                                <td className="px-6 py-3">{e.description}</td>
                                <td className="px-6 py-3 font-bold text-red-600">{e.amount}</td>
                                <td className="px-6 py-3">{e.approvedBy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- FINANCE MODULE ---
// ... (FinanceModule remains unchanged)
export const FinanceModule: React.FC<{user: User | null}> = ({user}) => {
    const [invoices] = usePersistentState<Invoice[]>('invoices_data_v3', []);
    const [expenses] = usePersistentState<Expense[]>('expenses_data_v3', []);

    const totalSales = invoices.reduce((acc, inv) => acc + inv.amount, 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = totalSales - totalExpenses;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">المالية والحسابات</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <p className="text-gray-500 mb-2">إجمالي الدخل</p>
                    <h2 className="text-3xl font-bold text-green-600">{totalSales.toLocaleString()} ج.م</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <p className="text-gray-500 mb-2">إجمالي المصروفات</p>
                    <h2 className="text-3xl font-bold text-red-600">{totalExpenses.toLocaleString()} ج.م</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <p className="text-gray-500 mb-2">صافي الربح</p>
                    <h2 className={`text-3xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{netProfit.toLocaleString()} ج.م</h2>
                </div>
            </div>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold mb-4 dark:text-white">ملخص العمليات</h3>
                <p className="text-gray-500">تم تسجيل {invoices.length} فاتورة مبيعات و {expenses.length} عملية مصروفات.</p>
             </div>
        </div>
    );
};

// --- PAYROLL MODULE ---
export interface PayrollProps {
    user: User | null;
    onCreateUser: (u: User) => void;
    onUpdateUser: (u: User) => void;
    onDeleteUser: (id: string) => void;
}

export const PayrollModule: React.FC<PayrollProps> = ({user}) => {
    const [employees, setEmployees] = usePersistentState<Employee[]>('employees_data_v3', []);
    const [showModal, setShowModal] = useState(false);
    const [newEmp, setNewEmp] = useState<Partial<Employee>>({});

    const handleSave = () => {
        const emp: Employee = {
            id: Date.now().toString(),
            name: newEmp.name || '',
            position: newEmp.position || '',
            baseSalary: Number(newEmp.baseSalary) || 0,
            netSalary: Number(newEmp.baseSalary) || 0,
            status: 'ACTIVE',
            joinDate: new Date().toISOString().split('T')[0],
            deductions: []
        };
        setEmployees([...employees, emp]);
        setShowModal(false);
        setNewEmp({});
        logAction('ADD_EMPLOYEE', `Added employee ${emp.name}`, user, 'PAYROLL');
    };

    const handleDeleteEmployee = (id: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
            setEmployees(employees.filter(e => e.id !== id));
            logAction('DELETE_EMPLOYEE', `Deleted employee ${id}`, user, 'PAYROLL');
        }
    };

    return (
        <div>
            <ModuleHeader title="شؤون الموظفين" onAdd={() => setShowModal(true)} addLabel="إضافة موظف" onExport={() => exportToCSV(employees, 'payroll_report')} />
             {showModal && (
                <Modal title="إضافة موظف جديد" onClose={() => setShowModal(false)}>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="الاسم" value={newEmp.name || ''} onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
                        <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="المنصب" value={newEmp.position || ''} onChange={e => setNewEmp({...newEmp, position: e.target.value})} />
                        <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="الراتب الأساسي" type="number" value={newEmp.baseSalary || ''} onChange={e => setNewEmp({...newEmp, baseSalary: Number(e.target.value)})} />
                        <button onClick={handleSave} className="w-full py-2 bg-blue-600 text-white rounded">حفظ</button>
                    </div>
                </Modal>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(emp => (
                    <div key={emp.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg dark:text-white">{emp.name}</h3>
                                <p className="text-sm text-gray-500">{emp.position}</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full h-fit">نشط</span>
                                <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:bg-red-50 rounded p-1 h-fit" title="حذف الموظف"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="border-t pt-4 mt-2 dark:border-slate-700">
                             <p className="flex justify-between text-sm mb-1 dark:text-gray-300"><span>الراتب الأساسي:</span> <span>{emp.baseSalary}</span></p>
                             <p className="flex justify-between text-sm font-bold dark:text-white"><span>صافي الراتب:</span> <span>{emp.netSalary}</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- REPORTS MODULE ---
// ... (ReportsModule remains unchanged)
export const ReportsModule: React.FC<{user: User | null}> = ({user}) => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">التقارير الشاملة</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onClick={() => exportToCSV(JSON.parse(localStorage.getItem('invoices_data_v3') || '[]'), 'sales_full')} className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 cursor-pointer hover:shadow-md transition-all">
                    <FileText className="text-blue-600 mb-4" size={32} />
                    <h3 className="font-bold text-blue-800 dark:text-blue-300">تقرير المبيعات</h3>
                    <p className="text-sm text-blue-600/70 mt-2">تصدير جميع الفواتير</p>
                </div>
                <div onClick={() => exportToCSV(JSON.parse(localStorage.getItem('inventory_data_v3') || '[]'), 'inventory_full')} className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800 cursor-pointer hover:shadow-md transition-all">
                    <Package className="text-purple-600 mb-4" size={32} />
                    <h3 className="font-bold text-purple-800 dark:text-purple-300">تقرير المخزون</h3>
                    <p className="text-sm text-purple-600/70 mt-2">جرد المخزون الحالي</p>
                </div>
                 <div onClick={() => exportToCSV(JSON.parse(localStorage.getItem('expenses_data_v3') || '[]'), 'expenses_full')} className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-800 cursor-pointer hover:shadow-md transition-all">
                    <Wallet className="text-red-600 mb-4" size={32} />
                    <h3 className="font-bold text-red-800 dark:text-red-300">تقرير المصروفات</h3>
                    <p className="text-sm text-red-600/70 mt-2">تفاصيل المصروفات</p>
                </div>
            </div>
        </div>
    );
};

// --- SETTINGS MODULE ---
// ... (SettingsModule remains largely unchanged but checking delete logic)
export const SettingsModule: React.FC<SettingsModuleProps> = ({ toggleTheme, toggleLanguage, theme, language, user, allUsers, onCreateUser, onUpdateUser, onDeleteUser }) => {
    const [settings, setSettings] = usePersistentState<CompanySettings>('company_settings_v3', {
        name: 'إنجاز للحلول',
        currency: 'EGP',
        taxRate: 14,
        stockAlert: { mode: 'REORDER_LEVEL', value: 0 },
        receiptConfig: { showLogo: false, headerText: '', footerText: '', showTaxId: true, fontSize: 'medium' },
        barcodeConfig: { height: 40, width: 2, showName: true, showPrice: true, fontSize: 14 },
        checkConfig: { bankName: '', showDate: true, signatureLine: '' },
        aiFeatures: { financialAdvisor: true, cashFlowAnalysis: true }
    });
    
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'USERS'>('GENERAL');
    const [showUserModal, setShowUserModal] = useState(false);
    const [formUser, setFormUser] = useState<Partial<User>>({ role: UserRole.VIEWER, permissions: [] });

    const availableModules = [
        { id: AppRoute.SALES, label: 'المبيعات (Sales)' },
        { id: AppRoute.PURCHASES, label: 'المشتريات (Purchases)' },
        { id: AppRoute.INVENTORY, label: 'المخزون (Inventory)' },
        { id: AppRoute.EXPENSES, label: 'المصروفات (Expenses)' },
        { id: AppRoute.FINANCE, label: 'المالية (Finance)' },
        { id: AppRoute.PAYROLL, label: 'شؤون الموظفين (Payroll)' },
        { id: AppRoute.REPORTS, label: 'التقارير (Reports)' },
        { id: AppRoute.SETTINGS, label: 'الإعدادات (Settings)' },
    ];

    const handleOpenUserModal = (targetUser?: User) => {
        if (targetUser) {
            setFormUser({ ...targetUser, permissions: targetUser.permissions || [] });
        } else {
            setFormUser({ role: UserRole.VIEWER, permissions: [] });
        }
        setShowUserModal(true);
    };

    const handleTogglePermission = (route: string) => {
        const currentPerms = formUser.permissions || [];
        if (currentPerms.includes(route)) {
            setFormUser({ ...formUser, permissions: currentPerms.filter(p => p !== route) });
        } else {
            setFormUser({ ...formUser, permissions: [...currentPerms, route] });
        }
    };

    const handleSaveUser = () => {
        if (!formUser.username || !formUser.name || !formUser.role) {
            alert("الرجاء إكمال البيانات الأساسية (الاسم، اسم المستخدم، الدور)");
            return;
        }
        if (formUser.id) {
            onUpdateUser(formUser as User);
        } else {
             if (!formUser.password) {
                 alert("كلمة المرور مطلوبة للمستخدم الجديد");
                 return;
             }
             onCreateUser({ ...formUser, id: Date.now().toString() } as User);
        }
        setShowUserModal(false);
    };

    return (
        <div>
            <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 mb-6">
                <button onClick={() => setActiveTab('GENERAL')} className={`pb-2 px-4 ${activeTab === 'GENERAL' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}>الإعدادات العامة</button>
                <button onClick={() => setActiveTab('USERS')} className={`pb-2 px-4 ${activeTab === 'USERS' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}>إدارة المستخدمين</button>
            </div>

            {activeTab === 'GENERAL' && (
                <div className="space-y-6 max-w-4xl">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 dark:text-white">تخصيص النظام</h3>
                        <div className="flex gap-4 mb-6">
                            <button onClick={toggleTheme} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg dark:text-white">
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                                <span>{theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
                            </button>
                             <button onClick={toggleLanguage} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg dark:text-white">
                                <Globe size={18} />
                                <span>{language === 'ar' ? 'English' : 'العربية'}</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm mb-1 dark:text-gray-300">اسم الشركة</label><input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} /></div>
                             <div><label className="block text-sm mb-1 dark:text-gray-300">نص تذييل الفاتورة</label><input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={settings.receiptConfig.footerText} onChange={e => setSettings({...settings, receiptConfig: {...settings.receiptConfig, footerText: e.target.value}})} /></div>
                        </div>
                     </div>
                </div>
            )}

            {activeTab === 'USERS' && (
                <div>
                     <div className="flex justify-between mb-4">
                        <h3 className="font-bold text-lg dark:text-white">المستخدمين والصلاحيات</h3>
                        <button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><UserPlus size={18} /> إضافة مستخدم</button>
                     </div>
                     <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-right">
                             <thead className="bg-gray-50 dark:bg-slate-900 text-sm text-gray-500"><tr><th className="px-6 py-3">الاسم</th><th className="px-6 py-3">اسم المستخدم</th><th className="px-6 py-3">الدور</th><th className="px-6 py-3">الصلاحيات</th><th className="px-6 py-3">إجراءات</th></tr></thead>
                             <tbody className="divide-y divide-gray-100 dark:divide-slate-700 dark:text-gray-300">
                                {allUsers.map(u => (
                                    <tr key={u.id}>
                                        <td className="px-6 py-3">{u.name}</td>
                                        <td className="px-6 py-3 font-mono text-xs">{u.username}</td>
                                        <td className="px-6 py-3"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{u.role}</span></td>
                                        <td className="px-6 py-3 text-xs text-gray-500">
                                            {u.role === UserRole.OWNER ? 'كامل الصلاحيات' : (u.permissions && u.permissions.length > 0 ? `${u.permissions.length} وحدات` : 'لا يوجد')}
                                        </td>
                                        <td className="px-6 py-3 flex gap-2">
                                            <button onClick={() => handleOpenUserModal(u)} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="تعديل"><Edit2 size={16} /></button>
                                            {/* Allow deletion of any user except the main super admin account which is protected in App.tsx logic */}
                                            {u.id !== 'super-admin-01' && (
                                                <button onClick={() => onDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="حذف"><Trash2 size={16} /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                     </div>
                      {showUserModal && (
                        <Modal title={formUser.id ? "تعديل المستخدم وصلاحياته" : "إضافة مستخدم جديد"} onClose={() => setShowUserModal(false)}>
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm mb-1 font-medium dark:text-gray-300">الاسم الكامل</label>
                                        <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={formUser.name || ''} onChange={e => setFormUser({...formUser, name: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="block text-sm mb-1 font-medium dark:text-gray-300">اسم الدخول</label>
                                        <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={formUser.username || ''} onChange={e => setFormUser({...formUser, username: e.target.value})} />
                                     </div>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 font-medium dark:text-gray-300">كلمة المرور {formUser.id && '(اتركه فارغاً للإبقاء على الحالية)'}</label>
                                    <input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" type="password" value={formUser.password || ''} onChange={e => setFormUser({...formUser, password: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 font-medium dark:text-gray-300">الدور الوظيفي</label>
                                    <select className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={formUser.role} onChange={e => setFormUser({...formUser, role: e.target.value as UserRole})}>
                                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="border-t pt-4 dark:border-slate-700">
                                    <label className="block text-sm font-bold mb-3 dark:text-white">تحديد صلاحيات الوصول:</label>
                                    <p className="text-xs text-gray-500 mb-3 dark:text-gray-400">حدد الأقسام التي يمكن لهذا المستخدم الوصول إليها.</p>
                                    {formUser.role === UserRole.OWNER ? (
                                        <p className="text-sm text-green-600 bg-green-50 p-2 rounded">المالك (Owner) يمتلك كافة الصلاحيات بشكل افتراضي ولا يمكن تقييده.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {availableModules.map(mod => (
                                                <label key={mod.id} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${formUser.permissions?.includes(mod.id) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        checked={formUser.permissions?.includes(mod.id) || false}
                                                        onChange={() => handleTogglePermission(mod.id)}
                                                    />
                                                    <span className="text-sm dark:text-gray-200">{mod.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleSaveUser} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm font-bold">
                                    {formUser.id ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
                                </button>
                            </div>
                        </Modal>
                    )}
                </div>
            )}
        </div>
    );
};
