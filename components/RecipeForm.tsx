"use client";

import { useState } from "react";
import {
  Recipe,
  Ingredient,
  CookingStep,
  CookingMethod,
  MealCategory,
  RecipeVersion,
} from "@/lib/types";
import { generateId } from "@/lib/utils";

const COOKING_METHODS: CookingMethod[] = [
  "boil", "sauté", "bake", "roast", "steam", "fry",
  "grill", "simmer", "stir-fry", "braise", "blanch", "other",
];

interface RecipeFormProps {
  initial?: Recipe;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

export function RecipeForm({ initial, onSave, onCancel }: RecipeFormProps) {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState<MealCategory>(initial?.category || "main");
  const [portionYield, setPortionYield] = useState(initial?.currentVersion.portionYield || 4);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.currentVersion.ingredients || [{ id: generateId(), name: "", quantity: 0, unit: "" }]
  );
  const [steps, setSteps] = useState<CookingStep[]>(
    initial?.currentVersion.cookingSteps || [
      { id: generateId(), order: 1, method: "other", description: "", durationMinutes: 0 },
    ]
  );

  function addIngredient() {
    setIngredients([...ingredients, { id: generateId(), name: "", quantity: 0, unit: "" }]);
  }

  function updateIngredient(index: number, updates: Partial<Ingredient>) {
    setIngredients(ingredients.map((ing, i) => (i === index ? { ...ing, ...updates } : ing)));
  }

  function removeIngredient(index: number) {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function addStep() {
    setSteps([
      ...steps,
      { id: generateId(), order: steps.length + 1, method: "other", description: "", durationMinutes: 0 },
    ]);
  }

  function updateStep(index: number, updates: Partial<CookingStep>) {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  }

  function handleSubmit() {
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const version: RecipeVersion = {
      id: generateId(),
      versionNumber: isEdit ? initial.currentVersion.versionNumber + 1 : 1,
      ingredients: ingredients.filter((i) => i.name.trim()),
      cookingSteps: steps.filter((s) => s.description.trim()),
      portionYield,
      createdAt: now,
      changeDescription: isEdit ? "Manual edit" : undefined,
    };

    const recipe: Recipe = {
      id: initial?.id || generateId(),
      name,
      category,
      currentVersion: version,
      versionHistory: isEdit ? [...initial.versionHistory, initial.currentVersion] : [],
      rating: initial?.rating,
      comments: initial?.comments || [],
      nutrients: initial?.nutrients,
      createdAt: initial?.createdAt || now,
      updatedAt: now,
    };

    onSave(recipe);
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-sage-200 bg-white text-sage-800 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent placeholder:text-sage-300";

  return (
    <div className="space-y-8">
      {/* Name & Category & Portions */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_120px] gap-4">
        <div>
          <label className="block text-xs font-semibold text-sage-400 uppercase tracking-wider mb-2">Recipe Name</label>
          <input
            className={inputClass}
            placeholder="e.g., Garlic Butter Chicken"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-sage-400 uppercase tracking-wider mb-2">Category</label>
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as MealCategory)}
          >
            <option value="main">Main Meal</option>
            <option value="snack">Snack</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-sage-400 uppercase tracking-wider mb-2">Portions</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={portionYield}
            onChange={(e) => setPortionYield(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-xs font-semibold text-sage-400 uppercase tracking-wider mb-3">Ingredients</label>
        <div className="space-y-3">
          {ingredients.map((ing, i) => (
            <div key={ing.id} className="flex gap-3 items-center">
              <input
                type="number"
                className={`${inputClass} w-24`}
                placeholder="Qty"
                value={ing.quantity || ""}
                onChange={(e) => updateIngredient(i, { quantity: Number(e.target.value) })}
              />
              <input
                className={`${inputClass} w-24`}
                placeholder="Unit"
                value={ing.unit}
                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
              />
              <input
                className={`${inputClass} flex-1`}
                placeholder="Ingredient name"
                value={ing.name}
                onChange={(e) => updateIngredient(i, { name: e.target.value })}
              />
              <button
                onClick={() => removeIngredient(i)}
                className="text-sage-300 hover:text-red-400 transition-colors text-xl px-2 shrink-0"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button onClick={addIngredient} className="mt-3 text-sm text-sage-500 hover:text-sage-700 transition-colors">
          + Add ingredient
        </button>
      </div>

      {/* Cooking Steps */}
      <div>
        <label className="block text-xs font-semibold text-sage-400 uppercase tracking-wider mb-3">Cooking Steps</label>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.id} className="flex gap-3 items-start">
              <span className="text-sm text-sage-300 mt-3 w-6 shrink-0 text-right font-medium">{step.order}.</span>
              <div className="flex-1 space-y-2">
                <div className="flex gap-3">
                  <select
                    className={`${inputClass} w-40`}
                    value={step.method}
                    onChange={(e) => updateStep(i, { method: e.target.value as CookingMethod })}
                  >
                    {COOKING_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className={`${inputClass} w-24`}
                      placeholder="Min"
                      value={step.durationMinutes || ""}
                      onChange={(e) => updateStep(i, { durationMinutes: Number(e.target.value) })}
                    />
                    <span className="text-xs text-sage-400 shrink-0">min</span>
                  </div>
                </div>
                <input
                  className={inputClass}
                  placeholder="Describe this step..."
                  value={step.description}
                  onChange={(e) => updateStep(i, { description: e.target.value })}
                />
              </div>
              <button
                onClick={() => removeStep(i)}
                className="text-sage-300 hover:text-red-400 transition-colors text-xl px-2 mt-2 shrink-0"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button onClick={addStep} className="mt-3 text-sm text-sage-500 hover:text-sage-700 transition-colors">
          + Add step
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t border-sage-100">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-sage-700 text-white rounded-xl text-sm font-medium hover:bg-sage-800 transition-colors shadow-sm"
        >
          {isEdit ? "Save Changes" : "Add Recipe"}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 text-sage-500 hover:text-sage-700 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
