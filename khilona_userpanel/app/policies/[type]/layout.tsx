import { notFound } from "next/navigation";
import { POLICY_TYPES } from "@/features/store/store-utils";

export default async function PolicyLayout({ children, params }: { children: React.ReactNode; params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!(type in POLICY_TYPES)) notFound();
  return children;
}
