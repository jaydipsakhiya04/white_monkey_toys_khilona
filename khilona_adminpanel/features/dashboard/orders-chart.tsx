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
          <p className="text-2xl font-semibold tracking-tight tabular">
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
        <div className="flex h-44 w-10 shrink-0 flex-col justify-between text-right text-[10px] text-muted tabular" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {fmt(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {/* grid */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44" aria-hidden>
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
            <div className="absolute inset-x-0 bottom-0 border-t border-line-strong" />
          </div>
          <ul
            className="relative flex h-44 items-end gap-[3px] sm:gap-1.5"
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
                        'block w-full rounded-t-[3px] transition-[height,background-color] duration-300',
                        v === 0 ? 'bg-stone-200' : isToday ? 'bg-brand' : 'bg-brand/55 group-hover:bg-brand/80',
                        active === i && 'bg-brand',
                      )}
                      style={{ height: v === 0 ? 2 : `${Math.max(h, 2)}%` }}
                    />
                  </button>
                  {active === i && (
                    <div
                      role="tooltip"
                      className={cn(
                        'pointer-events-none absolute bottom-full z-10 mb-2 w-max rounded-md bg-ink px-2.5 py-1.5 text-[11px] text-white shadow-pop',
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
