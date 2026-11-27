import React from 'react';
import {motion} from 'motion/react';
import type {MerchantCategory} from '../../types';

interface CategoryOption {
  id: MerchantCategory;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  {id: 'all', label: 'Todos'},
  {id: 'cafe', label: 'Cafés'},
  {id: 'comida', label: 'Comida'},
  {id: 'saldo', label: 'Saldo y Datos'},
];

interface CategoryPillsProps {
  selected: MerchantCategory;
  onChange: (category: MerchantCategory) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Filtrar comercios aliados"
      className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-x-auto no-scrollbar"
    >
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat.id)}
            className={`relative flex-1 min-h-[38px] px-3 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isActive ? 'text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="merchantCategoryIndicator"
                transition={{type: 'spring', stiffness: 460, damping: 34}}
                className="absolute inset-0 rounded-xl bg-amber-400 shadow-sm"
              />
            )}
            <span className="relative z-10">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
