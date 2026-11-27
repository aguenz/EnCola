import React from 'react';
import {motion} from 'motion/react';
import {ChevronDown, ChevronUp} from 'lucide-react';

interface BottomSheetProps {
  expanded: boolean;
  onToggleExpand: () => void;
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  expanded,
  onToggleExpand,
  title,
  subtitle,
  headerRight,
  footer,
  children,
}) => {
  return (
    <motion.aside
      aria-label={title}
      initial={{opacity: 0, y: 28}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 20}}
      transition={{duration: 0.34, ease: [0.16, 1, 0.3, 1]}}
      className="fixed left-0 right-0 bottom-0 z-[500] lg:left-5 lg:right-auto lg:top-5 lg:bottom-5 lg:w-[404px] flex flex-col pointer-events-none"
    >
      <div
        className={`obsidian-glass pointer-events-auto mt-auto lg:mt-0 lg:h-full flex flex-col rounded-t-[30px] lg:rounded-[28px] border-t lg:border border-white/[0.08] overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          expanded
            ? 'max-h-[84vh] lg:max-h-full'
            : 'max-h-[48vh] lg:max-h-full'
        }`}
      >
        {/* Minimalist Grab Handle & Header */}
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-label={expanded ? 'Contraer panel' : 'Expandir panel'}
          className="group w-full pt-3 lg:pt-5 pb-3.5 px-6 flex flex-col items-center border-b border-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 shrink-0"
        >
          <span className="lg:hidden w-9 h-1 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors mb-3" />

          <div className="w-full flex items-center justify-between gap-3 text-left">
            <div className="min-w-0">
              <h2 className="font-display text-[17px] font-bold text-white truncate leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-slate-400 truncate mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerRight}
              <span className="lg:hidden w-8 h-8 rounded-full bg-white/[0.05] group-hover:bg-white/[0.1] flex items-center justify-center text-slate-300 transition-colors">
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </span>
            </div>
          </div>
        </button>

        {/* Scrollable Content */}
        <div className="sheet-scroll flex-1 overflow-y-auto px-6 py-5 space-y-6 overscroll-contain">
          {children}
        </div>

        {/* Clean Docked Bottom Navigation */}
        {footer && (
          <div className="shrink-0 border-t border-white/[0.06] bg-[#06080D]/80 backdrop-blur-xl">
            {footer}
          </div>
        )}
      </div>
    </motion.aside>
  );
};
