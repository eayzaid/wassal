import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-wassal-border">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-wassal-plum tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-wassal-slate">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};
