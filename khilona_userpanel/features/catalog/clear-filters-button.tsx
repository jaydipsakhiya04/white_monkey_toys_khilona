"use client";

import { Button } from "@/components/ui/button";
import { useListingNav } from "./listing-nav";

export function ClearFiltersButton() {
  const { clearFilters, isPending } = useListingNav();
  return (
    <Button onClick={clearFilters} loading={isPending}>
      Clear all filters
    </Button>
  );
}
