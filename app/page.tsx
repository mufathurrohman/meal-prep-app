"use client";

import { useEffect, useState, useCallback } from "react";
import { useStorage } from "@/lib/storage";
import { Recipe, WeeklyPlan } from "@/lib/types";
import {
  getCurrentWeekLabel,
  createEmptyWeekSlots,
  generateId,
  DAYS,
  MEAL_SLOTS,
  getWeekDateSpan,
  shiftWeek,
} from "@/lib/utils";
import { WeeklyPlanGrid } from "@/components/WeeklyPlanGrid";

export default function MealPlanPage() {
  const storage = useStorage();
  const [weekLabel, setWeekLabel] = useState(getCurrentWeekLabel());
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ gaps: string[]; nutritionNotes: string[] } | null>(null);
  const [weekNote, setWeekNote] = useState("");

  const isCurrentWeek = weekLabel === getCurrentWeekLabel();

  const loadPlan = useCallback(
    async (label: string) => {
      setLoaded(false);
      setAnalysis(null);
      const [r, p] = await Promise.all([
        storage.getRecipes(),
        storage.getWeeklyPlan(label),
      ]);
      setRecipes(r);

      if (p) {
        setPlan(p);
        setWeekNote(p.notes || "");
      } else {
        const newPlan: WeeklyPlan = {
          id: generateId(),
          weekLabel: label,
          slots: createEmptyWeekSlots(),
          createdAt: new Date().toISOString(),
        };
        setPlan(newPlan);
        setWeekNote("");
      }
      setLoaded(true);
    },
    [storage]
  );

  useEffect(() => {
    loadPlan(weekLabel);
  }, [weekLabel, loadPlan]);

  useEffect(() => {
    if (!plan) return;
    const t = setTimeout(async () => {
      const updated = { ...plan, notes: weekNote || undefined };
      setPlan(updated);
      await storage.saveWeeklyPlan(updated);
    }, 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekNote]);

  function goToPrevWeek() {
    setWeekLabel(shiftWeek(weekLabel, -1));
  }

  function goToNextWeek() {
    setWeekLabel(shiftWeek(weekLabel, 1));
  }

  function goToCurrentWeek() {
    setWeekLabel(getCurrentWeekLabel());
  }

  async function handleAssign(slotId: string, recipeId: string | undefined) {
    if (!plan) return;
    const updated: WeeklyPlan = {
      ...plan,
      slots: plan.slots.map((s) =>
        s.id === slotId ? { ...s, recipeId, portionCount: recipeId ? 1 : undefined } : s
      ),
    };
    setPlan(updated);
    await storage.saveWeeklyPlan(updated);
  }

  async function handleAnalyze() {
    if (!plan) return;
    setAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "weekly-plan", plan, recipes }),
      });
      if (response.ok) {
        setAnalysis(await response.json());
      }
    } catch {
      // AI is optional
    } finally {
      setAnalyzing(false);
    }
  }

  function getPortionSummary() {
    if (!plan) return [];
    const counts: Record<string, number> = {};
    for (const slot of plan.slots) {
      if (slot.recipeId) {
        counts[slot.recipeId] = (counts[slot.recipeId] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([recipeId, needed]) => {
      const recipe = recipes.find((r) => r.id === recipeId);
      return {
        recipeId,
        name: recipe?.name || "Unknown",
        needed,
        yields: recipe?.currentVersion.portionYield || 0,
        sufficient: recipe ? needed <= recipe.currentVersion.portionYield : false,
      };
    });
  }

  function getStats() {
    if (!plan) return { filled: 0, total: 0, empty: 0 };
    const total = DAYS.length * MEAL_SLOTS.length;
    const filled = plan.slots.filter((s) => s.recipeId).length;
    return { filled, total, empty: total - filled };
  }

  if (!loaded || !plan) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sage-400 text-sm">Loading your meal plan...</p>
      </div>
    );
  }

  const summary = getPortionSummary();
  const stats = getStats();

  return (
    <div className="space-y-10">
      {/* Header with week picker */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-sage-900">Weekly Meal Plan</h1>

          {/* Week picker */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={goToPrevWeek}
              className="p-2 rounded-lg hover:bg-sage-100 text-sage-400 hover:text-sage-700 transition-colors"
              title="Previous week"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="text-center min-w-[260px]">
              <p className="text-lg font-medium text-sage-800">{getWeekDateSpan(weekLabel)}</p>
              <p className="text-xs text-sage-400 mt-0.5">
                {stats.filled} of {stats.total} slots filled
                {stats.empty > 0 && (
                  <span className="text-warm-500 ml-1">({stats.empty} empty)</span>
                )}
              </p>
            </div>

            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-sage-100 text-sage-400 hover:text-sage-700 transition-colors"
              title="Next week"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {!isCurrentWeek && (
              <button
                onClick={goToCurrentWeek}
                className="ml-2 px-3 py-1.5 text-xs font-medium text-sage-500 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="px-5 py-2.5 bg-warm-500 text-white rounded-xl text-sm font-medium hover:bg-warm-600 transition-colors disabled:opacity-50 shadow-sm"
        >
          {analyzing ? "Analyzing..." : "Analyze Plan with AI"}
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-sm">
        <WeeklyPlanGrid plan={plan} recipes={recipes} onAssign={handleAssign} />
      </div>

      {/* Bottom Section: Notes & Summary side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portion Summary */}
        <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-sage-800 mb-4">Portion Summary</h2>
          {summary.length === 0 ? (
            <p className="text-sm text-sage-400 py-4">Assign recipes to see portion requirements.</p>
          ) : (
            <div className="space-y-3">
              {summary.map((item) => (
                <div key={item.recipeId} className="flex items-center justify-between py-2 border-b border-sage-50 last:border-0">
                  <span className="text-sm text-sage-700 font-medium">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-sage-500">
                      {item.needed} needed
                      <span className="text-sage-300 mx-1">/</span>
                      {item.yields} per batch
                    </span>
                    {item.sufficient ? (
                      <span className="text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                        OK
                      </span>
                    ) : (
                      <span className="text-[11px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">
                        Short by {item.needed - item.yields}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Notes */}
        <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-sage-800 mb-4">Weekly Notes</h2>
          <textarea
            className="w-full h-40 px-4 py-3 rounded-xl border border-sage-200 bg-sage-50/30 text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent placeholder:text-sage-300 resize-none"
            placeholder="Jot down notes for this week's prep... (e.g., need to buy turmeric, try doubling the stir-fry batch, defrost chicken on Saturday night)"
            value={weekNote}
            onChange={(e) => setWeekNote(e.target.value)}
          />
        </div>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="bg-warm-50/70 border border-warm-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-sage-800 mb-4">AI Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.gaps.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-warm-600 mb-2">Gaps & Scheduling</h3>
                <ul className="space-y-2">
                  {analysis.gaps.map((gap, i) => (
                    <li key={i} className="text-sm text-sage-600 flex gap-2.5 items-start">
                      <span className="text-warm-400 mt-0.5 shrink-0">●</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.nutritionNotes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-warm-600 mb-2">Nutrition Notes</h3>
                <ul className="space-y-2">
                  {analysis.nutritionNotes.map((note, i) => (
                    <li key={i} className="text-sm text-sage-600 flex gap-2.5 items-start">
                      <span className="text-warm-400 mt-0.5 shrink-0">●</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
