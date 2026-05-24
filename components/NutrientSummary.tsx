"use client";

import { NutrientEstimate } from "@/lib/types";

export function NutrientSummary({ nutrients }: { nutrients: NutrientEstimate }) {
  const macros = [
    { label: "Calories", value: nutrients.caloriesPerPortion, unit: "kcal", color: "bg-warm-400" },
    { label: "Protein", value: nutrients.proteinGrams, unit: "g", color: "bg-emerald-400" },
    { label: "Carbs", value: nutrients.carbsGrams, unit: "g", color: "bg-amber-400" },
    { label: "Fat", value: nutrients.fatGrams, unit: "g", color: "bg-rose-400" },
  ];

  const total = nutrients.proteinGrams + nutrients.carbsGrams + nutrients.fatGrams;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-sage-500 uppercase tracking-wide">Per portion (estimated)</p>
      <div className="flex gap-4">
        {macros.map((m) => (
          <div key={m.label} className="text-center">
            <p className="text-lg font-semibold text-sage-800">
              {Math.round(m.value)}
              <span className="text-xs font-normal text-sage-400 ml-0.5">{m.unit}</span>
            </p>
            <p className="text-xs text-sage-500">{m.label}</p>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden bg-sage-100">
          {macros.slice(1).map((m) => (
            <div
              key={m.label}
              className={`${m.color} transition-all`}
              style={{ width: `${(m.value / total) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
