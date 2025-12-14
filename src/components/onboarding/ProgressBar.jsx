import React from 'react';
import { Check } from 'lucide-react';

export default function ProgressBar({ currentModule, totalModules }) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {Array.from({ length: totalModules }, (_, i) => i + 1).map((step) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-300
                  ${step < currentModule 
                    ? 'bg-emerald-500 text-white' 
                    : step === currentModule 
                      ? 'bg-slate-800 text-white ring-4 ring-slate-200' 
                      : 'bg-slate-100 text-slate-400'
                  }
                `}
              >
                {step < currentModule ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step
                )}
              </div>
              <span className={`mt-2 text-xs ${step === currentModule ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                Módulo {step}
              </span>
            </div>
            {step < totalModules && (
              <div 
                className={`
                  flex-1 h-0.5 mx-2
                  ${step < currentModule ? 'bg-emerald-500' : 'bg-slate-200'}
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}