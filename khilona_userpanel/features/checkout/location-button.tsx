"use client";

import { Check, LocateFixed, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Status = { kind: "idle" } | { kind: "locating" } | { kind: "done"; accuracy: number } | { kind: "error"; message: string };

export function mapsLinkFor(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/** Optional browser geolocation → lat/lng + maps link. Never required. */
export function UseLocationButton({
  latitude,
  longitude,
  onLocated,
  onClear,
}: {
  latitude: number | null;
  longitude: number | null;
  onLocated: (lat: number, lng: number) => void;
  onClear: () => void;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const locate = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus({ kind: "error", message: "Location isn't supported on this device. You can paste a Google Maps link instead." });
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setStatus({ kind: "error", message: "Location needs a secure (https) connection. Please paste a Google Maps link instead." });
      return;
    }
    setStatus({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocated(pos.coords.latitude, pos.coords.longitude);
        setStatus({ kind: "done", accuracy: Math.round(pos.coords.accuracy) });
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. That's okay — you can type your address or paste a Google Maps link."
            : err.code === err.TIMEOUT
              ? "Getting your location took too long. Please try again or paste a Google Maps link."
              : "We couldn't detect your location. Please try again or paste a Google Maps link.";
        setStatus({ kind: "error", message });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-sand/50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={locate} loading={status.kind === "locating"} loadingText="Detecting location…">
          <LocateFixed className="size-4" aria-hidden="true" />
          {hasLocation ? "Update my location" : "Use my current location"}
        </Button>
        {hasLocation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClear();
              setStatus({ kind: "idle" });
            }}
          >
            <X className="size-4" aria-hidden="true" />
            Remove location
          </Button>
        )}
      </div>
      <div aria-live="polite" className="mt-2 text-sm">
        {hasLocation ? (
          <p className="flex items-start gap-1.5 font-medium text-success-700">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Location added ({latitude!.toFixed(5)}, {longitude!.toFixed(5)})
              {status.kind === "done" && status.accuracy ? ` · accurate to ~${status.accuracy} m` : ""}.{" "}
              <a href={mapsLinkFor(latitude!, longitude!)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Check on map
              </a>
            </span>
          </p>
        ) : status.kind === "error" ? (
          <p className="text-ink">{status.message}</p>
        ) : (
          <p className="text-muted">Optional — helps our delivery team find you faster.</p>
        )}
      </div>
    </div>
  );
}
