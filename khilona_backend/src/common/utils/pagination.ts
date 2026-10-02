export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export function buildPage<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    items,
    meta: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  };
}

export const skipTake = (page: number, limit: number) => ({ skip: (page - 1) * limit, take: limit });
