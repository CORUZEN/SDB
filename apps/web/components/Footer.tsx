'use client';

interface FooterProps {
  variant?: 'default' | 'minimal';
  className?: string;
}

export default function Footer({ variant = 'default', className = '' }: FooterProps) {
  const baseClasses = "bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800 border-t border-gray-700/50";
  
  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-3">
        {/* Layout Simplificado */}
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          {/* Copyright */}
          <div className="text-gray-300 text-sm">
            FRIAXIS © 2025 Todos os direitos reservados
          </div>
          
          {/* Powered by */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-400">Powered by</span>
            <span className="text-green-400 font-semibold">Coruzen</span>
          </div>
        </div>
      </div>
    </div>
  );
}