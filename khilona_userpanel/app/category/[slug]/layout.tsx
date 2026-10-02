import { notFound } from "next/navigation";
import { getCategory } from "@/services/catalog.server";

/** Resolve existence before the loading boundary so unknown slugs return a real 404. */
export default async function CategoryLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  return children;
}
