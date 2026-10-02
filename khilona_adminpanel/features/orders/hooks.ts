'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';
import { orderService } from '@/services';
import type { AdminOrderDetail, OrderListParams, OrderStatus, PaymentStatus } from '@/types/api';
import { ORDER_STATUS_LABEL } from '@/utils/status';
import { useAuth } from '@/features/auth/auth-provider';

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: qk.orders.list(params),
    queryFn: () => orderService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useOrderStatusCounts() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.orders.counts,
    queryFn: orderService.statusCounts,
    enabled: status === 'authenticated',
    refetchInterval: 60_000,
  });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: qk.orders.detail(id), queryFn: () => orderService.get(id) });
}

function useSyncOrderCaches() {
  const qc = useQueryClient();
  return (order: AdminOrderDetail) => {
    qc.setQueryData(qk.orders.detail(order.id), order);
    if (order.orderNumber !== order.id) qc.setQueryData(qk.orders.detail(order.orderNumber), order);
    void qc.invalidateQueries({ queryKey: ['orders', 'list'] });
    void qc.invalidateQueries({ queryKey: qk.orders.counts });
    void qc.invalidateQueries({ queryKey: qk.dashboard });
  };
}

export function useUpdateOrderStatus() {
  const sync = useSyncOrderCaches();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      orderService.updateStatus(id, status, note),
    onSuccess: (order) => {
      sync(order);
      // stock may have been restored on cancel
      if (order.status === 'CANCELLED') void qc.invalidateQueries({ queryKey: qk.products.all });
      toast.success(`Order ${order.orderNumber} marked as ${ORDER_STATUS_LABEL[order.status].toLowerCase()}`);
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not update the order status')),
  });
}

export function useUpdateOrder() {
  const sync = useSyncOrderCaches();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; adminNote?: string | null; paymentStatus?: PaymentStatus }) =>
      orderService.update(id, body),
    onSuccess: (order) => sync(order),
  });
}
