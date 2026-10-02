'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { Select } from '@/components/ui/input';
import type { CategoryOption } from '@/types/api';
import { groupCategoryOptions } from './hooks';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  options: CategoryOption[];
  placeholder?: string;
  invalid?: boolean;
  wrapperClassName?: string;
  /** Show inactive marker */
  markInactive?: boolean;
};

/** Category select grouped by parent (top-level categories are selectable too). */
export const CategorySelect = forwardRef<HTMLSelectElement, Props>(function CategorySelect(
  { options, placeholder = 'Select a category', markInactive = true, ...props },
  ref,
) {
  const { tops, childrenOf, orphans } = groupCategoryOptions(options);
  const label = (o: CategoryOption) => `${o.name}${markInactive && !o.isActive ? ' (inactive)' : ''}`;
  return (
    <Select ref={ref} {...props}>
      <option value="">{placeholder}</option>
      {tops.map((top) => {
        const kids = childrenOf(top.id);
        if (kids.length === 0)
          return (
            <option key={top.id} value={top.id}>
              {label(top)}
            </option>
          );
        return (
          <optgroup key={top.id} label={top.name}>
            <option value={top.id}>{label(top)}</option>
            {kids.map((k) => (
              <option key={k.id} value={k.id}>
                {`↳ ${label(k)}`}
              </option>
            ))}
          </optgroup>
        );
      })}
      {orphans.map((o) => (
        <option key={o.id} value={o.id}>
          {label(o)}
        </option>
      ))}
    </Select>
  );
});
