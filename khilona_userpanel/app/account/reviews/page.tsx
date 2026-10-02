import type { Metadata } from "next";
import { ReviewsView } from "@/features/account/reviews-view";

export const metadata: Metadata = { title: "My Reviews" };

export default function Page() {
  return <ReviewsView />;
}
