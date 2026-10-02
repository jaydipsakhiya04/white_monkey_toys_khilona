import type { Metadata } from "next";
import { DocumentsView } from "@/features/account/documents-view";

export const metadata: Metadata = { title: "Documents" };

export default function Page() {
  return <DocumentsView />;
}
