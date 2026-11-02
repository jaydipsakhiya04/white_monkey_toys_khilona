"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Send, Store as StoreIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { WhatsAppIcon } from "@/components/icons/brand";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useAuth } from "@/features/auth/auth-provider";
import { useRequireLogin } from "@/features/auth/login-gate";
import { cn } from "@/utils/cn";
import { isValidIndianMobile, normalizeIndianMobile, whatsappLink } from "@/utils/phone";

export const PRICE_TYPES = [
  {
    value: "retailer",
    title: "Retailer price",
    body: "For toy shops and resellers buying for their own store.",
    Icon: StoreIcon,
  },
  {
    value: "wholesale",
    title: "Wholesale price",
    body: "For bulk buyers, distributors and large quantities.",
    Icon: Building2,
  },
] as const;

const QUANTITIES = ["Under 25 pieces", "25–100 pieces", "100–500 pieces", "500+ pieces", "Not sure yet"];

const schema = z.object({
  priceType: z.enum(["retailer", "wholesale"]),
  businessName: z.string().trim().min(2, "Enter your shop or business name").max(120),
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().refine(isValidIndianMobile, "Enter a valid 10-digit Indian mobile number"),
  city: z.string().trim().min(2, "Enter your city").max(60),
  categories: z.array(z.string()).max(20),
  quantity: z.string().min(1, "Choose an approximate quantity"),
  message: z.string().trim().max(600).optional(),
});
type Values = z.infer<typeof schema>;

/** The enquiry as a WhatsApp message the store team can act on immediately. */
function enquiryText(v: Values, storeName: string) {
  const type = PRICE_TYPES.find((t) => t.value === v.priceType)!.title;
  return [
    `Hi ${storeName}! I'd like your ${type.toLowerCase()} list.`,
    "",
    `• Business: ${v.businessName}`,
    `• Name: ${v.name}`,
    `• Mobile: ${normalizeIndianMobile(v.phone)}`,
    `• City: ${v.city}`,
    `• Interested in: ${v.categories.length ? v.categories.join(", ") : "All categories"}`,
    `• Approx. quantity: ${v.quantity}`,
    ...(v.message ? ["", v.message] : []),
  ].join("\n");
}

export function WholesaleEnquiry({
  storeName,
  whatsapp,
  defaultCity = "Surat",
  categories,
}: {
  storeName: string;
  /** store WhatsApp number or wa.me URL */
  whatsapp: string | null;
  defaultCity?: string;
  categories: string[];
}) {
  const { status, customer } = useAuth();
  const requireLogin = useRequireLogin();
  const signedIn = status === "authenticated";

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { priceType: "retailer", businessName: "", name: "", phone: "", city: defaultCity, categories: [], quantity: "", message: "" },
  });
  const priceType = useWatch({ control, name: "priceType" });
  const chosen = useWatch({ control, name: "categories" }) ?? [];

  // prefill contact details for signed-in customers (never overwrite what was typed)
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !signedIn || !customer) return;
    prefilled.current = true;
    if (!getValues("name")) setValue("name", customer.name);
    if (!getValues("phone")) setValue("phone", customer.phone);
  }, [signedIn, customer, getValues, setValue]);

  const onSubmit = handleSubmit((v) => {
    if (!requireLogin("request wholesale or retailer pricing")) return;
    if (!whatsapp) {
      toast.error("Online enquiries aren't available right now", { description: "Please call the store for wholesale pricing." });
      return;
    }
    window.open(whatsappLink(whatsapp, enquiryText(v, storeName)), "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp with your enquiry", { description: "Send the message and our team will reply with prices." });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">I’m looking for</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRICE_TYPES.map(({ value, title, body, Icon }) => {
            const active = priceType === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                  active ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink hover:border-ink/40",
                )}
              >
                <input type="radio" value={value} className="sr-only" {...register("priceType")} />
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", active ? "bg-white/15" : "bg-sand")}>
                  <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className={cn("mt-0.5 block text-sm leading-snug", active ? "text-white/70" : "text-muted")}>{body}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Shop / business name" autoComplete="organization" error={errors.businessName?.message} {...register("businessName")} />
        <TextField label="Your name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <TextField label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
        <TextField label="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
      </div>

      {categories.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">
            Categories you’re interested in <span className="font-normal text-muted">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = chosen.includes(c);
              return (
                <label
                  key={c}
                  className={cn(
                    "inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors",
                    on ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink hover:border-ink/40",
                  )}
                >
                  <input type="checkbox" value={c} className="sr-only" {...register("categories")} />
                  {c}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <SelectField label="Approximate quantity" error={errors.quantity?.message} {...register("quantity")}>
        <option value="">Select…</option>
        {QUANTITIES.map((q) => (
          <option key={q} value={q}>
            {q}
          </option>
        ))}
      </SelectField>

      <TextAreaField label="Anything else?" optional placeholder="Specific products, delivery or pickup preference…" rows={3} {...register("message")} />

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-muted">
          <WhatsAppIcon className="size-4 shrink-0 text-success-700" />
          {signedIn ? "Your enquiry opens in WhatsApp, ready to send." : "Log in to send your enquiry — it opens in WhatsApp, ready to send."}
        </p>
        <Button type="submit" size="lg" className="shrink-0">
          <Send className="size-4" aria-hidden="true" />
          {signedIn ? "Request pricing" : "Log in to request pricing"}
        </Button>
      </div>
    </form>
  );
}
