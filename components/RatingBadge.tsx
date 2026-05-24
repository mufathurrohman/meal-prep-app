"use client";

import { Rating } from "@/lib/types";

const config: Record<Rating, { label: string; bg: string; text: string }> = {
  "will-eat-again": { label: "Will eat again", bg: "bg-emerald-100", text: "text-emerald-800" },
  "need-to-modify": { label: "Need to modify", bg: "bg-amber-100", text: "text-amber-800" },
  "not-recommended": { label: "Not recommended", bg: "bg-red-100", text: "text-red-800" },
};

export function RatingBadge({
  rating,
  onSelect,
  interactive = false,
}: {
  rating?: Rating;
  onSelect?: (r: Rating) => void;
  interactive?: boolean;
}) {
  if (interactive) {
    return (
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(config) as Rating[]).map((r) => {
          const c = config[r];
          const selected = rating === r;
          return (
            <button
              key={r}
              onClick={() => onSelect?.(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selected ? `${c.bg} ${c.text} ring-2 ring-offset-1 ring-current` : "bg-sage-100 text-sage-500 hover:bg-sage-200"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (!rating) return null;
  const c = config[rating];
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
