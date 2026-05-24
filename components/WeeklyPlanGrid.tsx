"use client";

import Link from "next/link";
import { Recipe, WeeklyPlan as WeeklyPlanType, MealSlot, MealSlotType, DayOfWeek } from "@/lib/types";
import { DAYS, MEAL_SLOTS, DAY_LABELS, SLOT_LABELS } from "@/lib/utils";
import { RatingBadge } from "./RatingBadge";

interface WeeklyPlanGridProps {
  plan: WeeklyPlanType;
  recipes: Recipe[];
  onAssign: (slotId: string, recipeId: string | undefined) => void;
}

export function WeeklyPlanGrid({ plan, recipes, onAssign }: WeeklyPlanGridProps) {
  function getSlot(day: DayOfWeek, slotType: MealSlotType): MealSlot | undefined {
    return plan.slots.find((s) => s.day === day && s.slotType === slotType);
  }

  const mainRecipes = recipes.filter((r) => r.category === "main");
  const snackRecipes = recipes.filter((r) => r.category === "snack");

  function isSnackSlot(slotType: MealSlotType): boolean {
    return slotType.includes("snack");
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold text-sage-400 uppercase tracking-wider p-3 w-40" />
            {DAYS.map((day) => (
              <th
                key={day}
                className="text-center text-xs font-semibold text-sage-600 uppercase tracking-wider p-3 w-1/5"
              >
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MEAL_SLOTS.map((slotType, rowIdx) => (
            <tr
              key={slotType}
              className={`${rowIdx > 0 ? "border-t border-sage-100" : ""} ${
                isSnackSlot(slotType) ? "bg-sage-50/30" : ""
              }`}
            >
              <td className="text-xs font-medium text-sage-500 p-3 align-middle whitespace-nowrap">
                <div className="flex flex-col">
                  <span>{SLOT_LABELS[slotType]}</span>
                  {isSnackSlot(slotType) && (
                    <span className="text-[10px] text-sage-300 mt-0.5">snack</span>
                  )}
                </div>
              </td>
              {DAYS.map((day) => {
                const slot = getSlot(day, slotType);
                const assigned = slot?.recipeId
                  ? recipes.find((r) => r.id === slot.recipeId)
                  : null;
                const options = isSnackSlot(slotType) ? snackRecipes : mainRecipes;

                return (
                  <td key={day} className="p-2 align-middle">
                    <div className="relative">
                      <select
                        className={`w-full px-3 py-3 rounded-xl text-sm border-2 transition-all cursor-pointer appearance-none ${
                          assigned
                            ? "border-sage-200 bg-white text-sage-800 font-medium shadow-sm hover:border-sage-300"
                            : "border-dashed border-sage-200 bg-transparent text-sage-300 hover:border-sage-300 hover:bg-sage-50/50"
                        } focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent`}
                        value={slot?.recipeId || ""}
                        onChange={(e) =>
                          slot && onAssign(slot.id, e.target.value || undefined)
                        }
                      >
                        <option value="">—</option>
                        {options.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      {assigned && (
                        <div className="mt-1.5 flex items-center justify-between px-1">
                          <Link
                            href={`/recipes/${assigned.id}`}
                            className="text-[10px] text-sage-400 hover:text-sage-600 underline underline-offset-2"
                          >
                            view recipe
                          </Link>
                          {assigned.rating && (
                            <RatingBadge rating={assigned.rating} />
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
