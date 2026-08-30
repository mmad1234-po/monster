import React, { Component, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`[ErrorBoundary - ${this.props.componentName || 'General'}] caught an error:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full my-4 p-6 md:p-8 bg-slate-900/95 border-2 border-rose-500/40 rounded-3xl text-white shadow-2xl backdrop-blur-xl text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-400">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>

          <h3 className="text-xl font-black text-rose-300 mb-2">
            خطای غیرمنتظره در بخش {this.props.componentName || 'برنامه'}
          </h3>
          
          <p className="text-xs md:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            سیستم محافظتی بازی برای جلوگیری از متوقف شدن برنامه وارد عمل شد. با کلیک بر روی دکمه زیر می‌توانید این بخش را بازنشانی کنید یا به محیط اصلی بازگردید.
          </p>

          {this.state.error && (
            <div className="w-full max-w-lg mb-6 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-right overflow-x-auto text-[11px] font-mono text-rose-400">
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-transform active:scale-95 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش مجدد و بارگذاری
            </button>

            {this.props.onReset && (
              <button
                onClick={this.props.onReset}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                بازگشت به خانه
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
