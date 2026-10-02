import { notFound } from "next/navigation";
import { getProduct } from "@/services/catalog.server";

/** Resolve existence before the loading boundary so unknown slugs return a real 404. */
export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return children;
}
