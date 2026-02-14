

export enum UserRole {
  OWNER = 'OWNER',       // مالك - كامل الصلاحيات
  ADMIN = 'ADMIN',       // مدير نظام
  ACCOUNTANT = 'ACCOUNTANT', // محاسب
  MANAGER = 'MANAGER',   // مدير فرع
  VIEWER = 'VIEWER',     // مشاهد فقط
  SALES = 'SALES'        // كاشير
}

export enum AppRoute {
  DASHBOARD = 'DASHBOARD',
  SALES = 'SALES',
  PURCHASES = 'PURCHASES',
  INVENTORY = 'INVENTORY',
  EXPENSES = 'EXPENSES',
  PAYROLL = 'PAYROLL',
  FINANCE = 'FINANCE',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}

export interface User {
  id: string;
  username: string; 
  name: string;
  role: UserRole;
  password?: string; 
  permissions?: string[];
  email?: string; // Added for type safety with Firebase user object
}

export interface UserSession {
  id: string;
  userId: string;
  username: string;
  loginTime: string;
  userAgent: string; // Browser/Device info
  ip?: string; // Optional (client-side IP detection is limited)
}

export interface InventoryLocation {
  id: string;
  name: string;
  address?: string;
  type: 'STORE' | 'WAREHOUSE' | 'BRANCH';
}

export interface StockTransfer {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  approvedBy: string;
}

export interface StockAlertConfig {
  mode: 'REORDER_LEVEL' | 'GLOBAL_MIN' | 'PERCENTAGE';
  value: number; // Used for GLOBAL_MIN or PERCENTAGE
}

export interface ReceiptConfig {
  showLogo: boolean;
  logoUrl?: string; // Base64 or URL
  headerText: string;
  footerText: string;
  showTaxId: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface BarcodeConfig {
  height: number;
  width: number;
  showName: boolean;
  showPrice: boolean;
  fontSize: number;
}

export interface CheckConfig {
  bankName: string;
  showDate: boolean;
  signatureLine: string;
}

export interface CompanySettings {
  name: string;
  logoUrl?: string;
  currency: string;
  taxRate: number;
  address?: string;
  stockAlert: StockAlertConfig;
  receiptConfig: ReceiptConfig; 
  barcodeConfig: BarcodeConfig; 
  checkConfig: CheckConfig;     
  aiFeatures: {
    financialAdvisor: boolean;
    cashFlowAnalysis: boolean;
  };
}

export interface Invoice {
  id: string;
  number: string;
  customerName: string;
  date: string;
  amount: number;
  lateFees?: number; // Added field
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  items: number;
}

export interface PurchaseItem {
  itemId: string;
  name: string;
  quantity: number;
  cost: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  balance: number;
}

export interface PaymentTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  amount: number;
  type: 'PAYMENT' | 'PURCHASE_PARTIAL' | 'PURCHASE_FULL';
  method: 'CASH' | 'VISA' | 'CHEQUE';
  reference?: string; // Cheque number or Invoice number
  previousBalance?: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  quantity: number;
  unit: string; 
  unitPrice: number;
  reorderLevel: number;
  category: string;
  location?: string; // Main Store, Warehouse A, etc.
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  baseSalary: number; 
  netSalary: number; 
  status: 'ACTIVE' | 'LEAVE';
  joinDate: string;
  deductions: Deduction[];
  linkedUserId?: string; 
}

export interface Deduction {
  id: string;
  date: string;
  amount: number;
  type: 'QUARTER_DAY' | 'HALF_DAY' | 'FULL_DAY' | 'OTHER' | 'ADVANCE';
  reason: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  approvedBy: string;
}

export interface FinancialMetric {
  label: string;
  value: number;
  trend: number; 
  isPositive: boolean;
}

export interface AppContextState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  activeRoute: AppRoute;
}

export interface RolePermission {
  role: UserRole;
  canEditSettings: boolean;
  canDeleteItems: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  performedBy: string;
  module: string;
}