"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Search, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { ORDER_NUMBER_EXAMPLE, ORDER_NUMBER_PATTERN } from "@/lib/brand";
import { trackOrder } from "@/services/orders";
import type { PublicOrder } from "@/types/api";
import { formatPhone, isValidIndianMobile, normalizeIndianMobile } from "@/utils/phone";

const schema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required").regex(ORDER_NUMBER_PATTERN, `Order number looks like ${ORDER_NUMBER_EXAMPLE}`),
  phone: z.string().trim().refine(isValidIndianMobile, "Enter the 10-digit mobile number used for the order"),
});

type Values = z.infer<typeof schema>;

export function TrackForm({
  defaultOrderNumber = "",
  onFound,
  submitLabel = "Track order",
  lockOrderNumber,
}: {
  defaultOrderNumber?: string;
  onFound: (order: PublicOrder, phone: string) => void;
  submitLabel?: string;
  lockOrderNumber?: boolean;
}) {
  const { register, handleSubmit, formState, getValues, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { orderNumber: defaultOrderNumber, phone: "" },
  });

  // signed in: use the account's mobile number automatically (still editable for other orders)
  const { isAuthenticated, customer } = useAuth();
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !isAuthenticated || !customer?.phone) return;
    prefilled.current = true;
    if (!getValues("phone")) setValue("phone", customer.phone, { shouldValidate: false });
  }, [isAuthenticated, customer?.phone, getValues, setValue]);
  const usingAccountPhone = !!customer?.phone && normalizeIndianMobile(watch("phone") ?? "") === customer.phone;

  const m = useMutation<PublicOrder, ApiError, Values>({
    mutationFn: (v) => trackOrder(v.orderNumber.trim().toUpperCase(), normalizeIndianMobile(v.phone)),
    onSuccess: (order, v) => onFound(order, normalizeIndianMobile(v.phone)),
  });

  return (
    <form onSubmit={handleSubmit((v) => m.mutate(v))} noValidate className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="Order number"
        autoComplete="off"
        autoCapitalize="characters"
        readOnly={lockOrderNumber}
        hint={lockOrderNumber ? undefined : `e.g. ${ORDER_NUMBER_EXAMPLE}`}
        error={formState.errors.orderNumber?.message}
        {...register("orderNumber")}
      />
      <TextField
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        hint={
          usingAccountPhone ? (
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3.5" aria-hidden="true" /> From your account · {formatPhone(customer!.phone)}
            </span>
          ) : isAuthenticated ? undefined : "The mobile number used when ordering"
        }
        error={formState.errors.phone?.message}
        {...register("phone")}
      />
      {m.error && (
        <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger-700 sm:col-span-2">
          {m.error.status === 404
            ? "We couldn't find an order with these details. Please check the order number and mobile number."
            : errorMessage(m.error)}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" loading={m.isPending} loadingText="Looking up…" className="w-full sm:w-auto">
          <Search className="size-4" aria-hidden="true" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
