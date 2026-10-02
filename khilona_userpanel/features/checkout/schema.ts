import { z } from "zod";
import { isValidIndianMobile } from "@/utils/phone";

const httpUrl = /^https?:\/\/[^\s]+$/i;

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`);

/** Mirrors backend validation for POST /orders (client-side for fast feedback). */
export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(80, "Name must be at most 80 characters"),
  phone: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .refine(isValidIndianMobile, "Enter a valid 10-digit Indian mobile number (starts with 6–9)"),
  alternatePhone: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidIndianMobile(v), "Enter a valid 10-digit Indian mobile number"),
  email: z
    .string()
    .trim()
    .max(120, "Email is too long")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Enter a valid email address"),
  address: z
    .string()
    .trim()
    .min(5, "Please enter your full address (house/flat, street, area)")
    .max(500, "Address must be at most 500 characters"),
  city: z.string().trim().min(2, "City is required").max(60, "City must be at most 60 characters"),
  state: z.string().trim().min(2, "State is required").max(60, "State must be at most 60 characters"),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  landmark: optionalText(150, "Landmark"),
  googleMapsLink: z
    .string()
    .trim()
    .max(500, "Link is too long")
    .refine((v) => v === "" || httpUrl.test(v), "Enter a valid link starting with http:// or https://"),
  locationLink: z
    .string()
    .trim()
    .max(500, "Link is too long")
    .refine((v) => v === "" || httpUrl.test(v), "Enter a valid link starting with http:// or https://"),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  note: optionalText(1000, "Note"),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const EMPTY_CHECKOUT: CheckoutValues = {
  customerName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  googleMapsLink: "",
  locationLink: "",
  latitude: null,
  longitude: null,
  note: "",
};

export const STEP_FIELDS: (keyof CheckoutValues)[][] = [
  ["customerName", "phone", "alternatePhone", "email"],
  ["address", "city", "state", "pincode", "landmark", "googleMapsLink", "locationLink", "latitude", "longitude", "note"],
  [],
];

export const STEPS = [
  { id: "contact", label: "Your details" },
  { id: "address", label: "Delivery" },
  { id: "review", label: "Review" },
] as const;

export function stepOfField(field: string): number {
  const idx = STEP_FIELDS.findIndex((fields) => fields.includes(field as keyof CheckoutValues));
  return idx === -1 ? 2 : idx;
}
