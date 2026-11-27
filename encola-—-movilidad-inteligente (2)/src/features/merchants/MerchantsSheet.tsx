import React, {useMemo, useState} from 'react';
import {motion} from 'motion/react';
import {ArrowUpRight, MapPin, Ticket} from 'lucide-react';
import {CategoryPills} from '../../components/ui/CategoryPills';
import type {Merchant, MerchantCategory, RedemptionTicket} from '../../types';

interface MerchantsSheetProps {
  merchants: Merchant[];
  confirmedPoints: number;
  activeTicket: RedemptionTicket | null;
  onFocusMerchantOnMap: (merchant: Merchant) => void;
  onRedeemMerchant: (merchant: Merchant) => void;
  onReopenActiveTicket: () => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const MerchantsSheet: React.FC<MerchantsSheetProps> = ({
  merchants,
  confirmedPoints,
  activeTicket,
  onFocusMerchantOnMap,
  onRedeemMerchant,
  onReopenActiveTicket,
}) => {
  const [category, setCategory] = useState<MerchantCategory>('all');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const filteredMerchants = useMemo(() => {
    if (category === 'all') return merchants;
    return merchants.filter((m) => m.category === category);
  }, [merchants, category]);

  const hasValidActiveTicket =
    activeTicket && activeTicket.expiresAt > Date.now();

  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.28, ease: EASE_OUT_EXPO}}
      className="space-y-5"
    >
      {/* Reopen Active Unexpired Ticket Banner */}
      {hasValidActiveTicket && (
        <motion.button
          type="button"
          whileTap={{scale: 0.98}}
          onClick={onReopenActiveTicket}
          className="w-full min-h-[54px] px-4 py-3 rounded-2xl bg-amber-400/12 border border-amber-400/35 text-left flex items-center justify-between gap-3 hover:bg-amber-400/18 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-300 truncate font-mono-tabular">
                Boleto activo · {activeTicket.code}
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                {activeTicket.merchantName}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-300 shrink-0">
            Abrir
          </span>
        </motion.button>
      )}

      {/* Spring-Animated Category Switcher */}
      <CategoryPills selected={category} onChange={setCategory} />

      {/* Clean Editorial Merchant Cards */}
      <div className="space-y-4">
        {filteredMerchants.map((merchant, idx) => {
          const canAfford = confirmedPoints >= merchant.pointsCost;
          const missingPoints = merchant.pointsCost - confirmedPoints;
          const imgFailed = brokenImages[merchant.id];

          return (
            <motion.article
              key={merchant.id}
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              transition={{
                duration: 0.3,
                delay: idx * 0.05,
                ease: EASE_OUT_EXPO,
              }}
              className="group rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden transition-colors hover:border-white/[0.15]"
            >
              <button
                type="button"
                onClick={() => onFocusMerchantOnMap(merchant)}
                className="relative block w-full aspect-[16/9] bg-[#06080D] overflow-hidden text-left"
              >
                {!imgFailed ? (
                  <img
                    src={merchant.imageUrl}
                    alt={merchant.name}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImages((prev) => ({
                        ...prev,
                        [merchant.id]: true,
                      }))
                    }
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-[#06080D] flex items-center justify-center text-4xl">
                    {merchant.emoji}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080B12] via-[#080B12]/35 to-transparent" />

                <span className="absolute top-3 right-3 rounded-xl bg-[#080B12]/85 backdrop-blur-md border border-white/10 px-2.5 py-1 font-mono-tabular text-xs font-bold text-amber-300">
                  {merchant.pointsCost} pts
                </span>

                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-[11px] font-medium text-slate-300 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    {merchant.referenceStop}
                  </p>
                  <h3 className="font-display text-base font-bold text-white leading-tight mt-0.5">
                    {merchant.name}
                  </h3>
                </div>
              </button>

              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-300 leading-snug">
                    {merchant.offerTitle}
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {merchant.offerDescription}
                  </p>
                </div>

                <motion.button
                  type="button"
                  whileTap={canAfford ? {scale: 0.96} : undefined}
                  onClick={() => onRedeemMerchant(merchant)}
                  disabled={!canAfford}
                  className={`min-h-[42px] px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    canAfford
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                      : 'bg-white/[0.05] text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {canAfford ? 'Canjear' : `Faltan ${missingPoints}`}
                  </span>
                  {canAfford && <ArrowUpRight className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.div>
  );
};
