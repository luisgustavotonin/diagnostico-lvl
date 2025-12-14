import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Building2, Settings } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  // Páginas públicas sem header
  if (currentPageName === 'Onboarding') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {currentPageName === 'Admin' && (
        <nav className="bg-slate-900 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link 
              to={createPageUrl('Admin')}
              className="flex items-center gap-2 font-semibold"
            >
              <Building2 className="w-5 h-5" />
              Onboarding Performance
            </Link>
            <Link 
              to={createPageUrl('Onboarding')}
              target="_blank"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Ver formulário público →
            </Link>
          </div>
        </nav>
      )}
      {children}
    </div>
  );
}