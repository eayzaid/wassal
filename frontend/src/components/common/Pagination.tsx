import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number; // 0-based index
  totalPages: number;
  totalElements: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  itemName?: string;
  disabled?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize = 10,
  onPageChange,
  itemName = 'éléments',
  disabled = false,
  className = '',
}) => {
  if (totalElements === 0) return null;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);
  const hasPrevious = currentPage > 0;
  const hasNext = currentPage + 1 < totalPages;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-xs text-wassal-slate select-none ${className}`}
    >
      <div className="text-center sm:text-left">
        <span>
          Affichage de <span className="font-semibold text-wassal-plum">{startItem}</span> à{' '}
          <span className="font-semibold text-wassal-plum">{endItem}</span> sur{' '}
          <span className="font-semibold text-wassal-plum">{totalElements}</span> {itemName}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrevious || disabled}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-9 px-3 gap-1 text-xs border-wassal-border text-wassal-plum hover:bg-wassal-bg disabled:opacity-40"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        <span className="px-3 py-1.5 rounded-lg bg-wassal-bg font-semibold text-wassal-plum text-xs border border-wassal-border">
          Page {currentPage + 1} / {Math.max(1, totalPages)}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNext || disabled}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-9 px-3 gap-1 text-xs border-wassal-border text-wassal-plum hover:bg-wassal-bg disabled:opacity-40"
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
