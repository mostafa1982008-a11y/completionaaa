
console.log('Script Loaded! (Index.tsx starting...)');

import React, { Component, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Error Boundary to catch render errors
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Reverted to a state property initializer, which is a more standard and concise
  // way to initialize state in modern React class components. This resolves issues
  // where TypeScript might not correctly infer the existence of `this.state` and `this.props`.
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Application Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans" dir="rtl">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">عذراً، حدث خطأ غير متوقع</h1>
            <p className="text-gray-600 mb-6">واجه النظام مشكلة تقنية. يرجى محاولة تحديث الصفحة.</p>
            <div className="bg-gray-50 p-4 rounded text-left text-xs font-mono text-gray-500 overflow-auto max-h-40 mb-6" dir="ltr">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

console.log('React Root Rendered Successfully.');