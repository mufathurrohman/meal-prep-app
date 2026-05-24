"use client";

import { NutrientEstimate } from "@/lib/types";

export function NutrientSummary({ nutrients }: { nutrients: NutrientEstimate }) {
  const macros = [
    { label: "Protein", value: nutrients.proteinGrams, unit: "g", color: "bg-emerald-400", textColor: "text-emerald-600", dotColor: "bg-emerald-400" },
    { label: "Carbs", value: nutrients.carbsGrams, unit: "g", color: "bg-amber-400", textColor: "text-amber-600", dotColor: "bg-amber-400" },
    { label: "Fat", value: nutrients.fatGrams, unit: "g", color: "bg-rose-400", textColor: "text-rose-600", dotColor: "bg-rose-400" },
  ];

  const total = nutrients.proteinGrams + nutrients.carbsGrams + nutrients.fatGrams;

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider">Nutrition per portion (estimated)</p>

      {/* Calorie headline */}
      <div>
        <span className="text-3xl font-semibold text-sage-800">{Math.round(nutrients.caloriesPerPortion)}</span>
        <span className="text-sm text-sage-400 ml-1.5">kcal</span>
      </div>

      {/* Macro values */}
      <div className="flex gap-6">
        {macros.map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${m.dotColor} shrink-0`} />
            <div>
              <span className="text-sm font-semibold text-sage-800">{Math.round(m.value)}{m.unit}</span>
              <span className="text-xs text-sage-400 ml-1.5">{m.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Macro ratio bar with labels */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex h-4 rounded-full overflow-hidden bg-sage-100">
            {macros.map((m) => {
              const pct = (m.value / total) * 100;
              return (
                <div
                  key={m.label}
                  className={`${m.color} transition-all relative flex items-center justify-center`}
                  style={{ width: `${pct}%` }}
                >
                  {pct >= 15 && (
                    <span className="text-[10px] font-semibold text-white">
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-[11px] text-sage-400">
            {macros.map((m) => {
              const pct = Math.round((m.value / total) * 100);
              return (
                <span key={m.label} className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${m.dotColor}`} />
                  {m.label} {pct}%
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
