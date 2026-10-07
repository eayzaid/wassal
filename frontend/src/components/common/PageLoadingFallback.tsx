import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoadingFallback: React.FC = () => {
  return (
    <div
      className="flex-1 w-full min-h-[50vh] flex flex-col items-center justify-center p-8 text-wassal-slate space-y-3 animate-in fade-in duration-150"
      aria-busy="true"
      aria-label="Chargement de la page"
    >
      <Loader2 className="w-8 h-8 animate-spin text-wassal-green-ink" />
      <p className="text-xs font-semibold text-wassal-slate tracking-wide">
        Chargement...
      </p>
    </div>
  );
};
