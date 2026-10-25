'use client';

import { useState } from 'react';
import { Segmented } from '@/components/ui/tabs';
import type { Dashboard } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatCurrency, formatCurrencyCompact, formatDayLabel, formatNumber, formatWeekday, todayInStoreTz } from '@/utils/format';

type Point = Dashboard['ordersLast14Days'][number];
type Metric = 'count' | 'total';

function niceMax(v: number): number {
  if (v <= 0) return 4;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  const out = nice * exp;
  return out < 4 && Number.isInteger(v) ? 4 : out;
}

/** 14-day bar chart drawn with plain HTML/CSS (no chart library). */
export function OrdersChart({ data }: { data: Point[] }) {
  const [metric, setMetric] = useState<Metric>('count');
  const [active, setActive] = useState<number | null>(null);
  const values = data.map((d) => (metric === 'count' ? d.count : d.total));
  const max = niceMax(Math.max(...values, 0));
  const ticks = [max, max / 2, 0];
  const fmt = (v: number) => (metric === 'count' ? formatNumber(v) : formatCurrencyCompact(v));
  const sumCount = data.reduce((s, d) => s + d.count, 0);
  const sumTotal = data.reduce((s, d) => s + d.total, 0);
  const today = todayInStoreTz();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-[28px] font-bold tracking-[-0.03em] tabular">
            {metric === 'count' ? formatNumber(sumCount) : formatCurrency(sumTotal)}
          </p>
          <p className="text-xs text-muted">{metric === 'count' ? 'orders' : 'order value'} in the last 14 days</p>
        </div>
        <Segmented
          label="Chart metric"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'count', label: 'Orders' },
            { value: 'total', label: 'Value' },
          ]}
        />
      </div>

      <div className="flex gap-2">
        {/* y axis */}
        <div className="flex h-52 w-10 shrink-0 flex-col justify-between text-right text-[10px] text-muted tabular" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {fmt(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {/* grid */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-52" aria-hidden>
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
            <div className="absolute inset-x-0 bottom-0 border-t border-line-strong" />
          </div>
          <style>{`@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
          <ul
            className="relative flex h-52 items-end gap-[3px] sm:gap-1.5"
            aria-label={`Orders per day, last 14 days, ${metric === 'count' ? 'order count' : 'order value'}`}
          >
            {data.map((d, i) => {
              const v = values[i];
              const h = max > 0 ? (v / max) * 100 : 0;
              const label = `${formatWeekday(d.date)} ${formatDayLabel(d.date)}: ${formatNumber(d.count)} order${d.count === 1 ? '' : 's'}, ${formatCurrency(d.total)}`;
              const isToday = d.date === today;
              return (
                <li key={d.date} className="relative flex h-full min-w-0 flex-1 items-end">
                  <button
                    type="button"
                    aria-label={label}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="group flex h-full w-full items-end rounded-sm focus-visible:outline-offset-1"
                  >
                    <span
                      className={cn(
                        'block w-full origin-bottom animate-[grow_600ms_cubic-bezier(0.2,0.8,0.2,1)_both] rounded-t-md transition-[height,opacity,filter] duration-300',
                        v === 0
                          ? 'bg-stone-200'
                          : isToday
                            ? 'bg-gradient-to-t from-brand to-[#FF8A55] shadow-[0_-4px_16px_-4px_rgb(240_90_34/0.5)]'
                            : 'bg-gradient-to-t from-[#FFB088] to-[#FFD3BD] group-hover:from-[#FF8A55] group-hover:to-[#FFB088]',
                        active === i && v > 0 && 'from-brand to-[#FF8A55]',
                      )}
                      style={{ height: v === 0 ? 2 : `${Math.max(h, 2)}%`, animationDelay: `${i * 25}ms` }}
                    />
                  </button>
                  {active === i && (
                    <div
                      role="tooltip"
                      className={cn(
                        'pointer-events-none absolute bottom-full z-10 mb-2 w-max animate-pop rounded-lg bg-night px-3 py-2 text-[11px] text-white shadow-pop ring-1 ring-white/10',
                        i < 3 ? 'left-0' : i > data.length - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2',
                      )}
                    >
                      <p className="font-medium">
                        {formatWeekday(d.date)}, {formatDayLabel(d.date)}
                      </p>
                      <p className="tabular text-stone-300">
                        {formatNumber(d.count)} order{d.count === 1 ? '' : 's'} · {formatCurrency(d.total)}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex gap-[3px] text-[10px] text-muted sm:gap-1.5" aria-hidden>
            {data.map((d, i) => (
              <span
                key={d.date}
                className={cn(
                  'min-w-0 flex-1 truncate text-center tabular',
                  i % 2 === 1 && i !== data.length - 1 ? 'invisible sm:visible' : '',
                  d.date === today && 'font-semibold text-ink',
                )}
              >
                {d.date === today ? 'Today' : formatDayLabel(d.date).split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
