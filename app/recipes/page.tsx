"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStorage } from "@/lib/storage";
import { Recipe } from "@/lib/types";
import { RecipeForm } from "@/components/RecipeForm";
import { RatingBadge } from "@/components/RatingBadge";
import { NutrientSummary } from "@/components/NutrientSummary";

export default function RecipesPage() {
  const storage = useStorage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "main" | "snack">("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storage.getRecipes().then((r) => {
      setRecipes(r);
      setLoaded(true);
    });
  }, [storage]);

  async function handleSave(recipe: Recipe) {
    await storage.saveRecipe(recipe);
    setRecipes(await storage.getRecipes());
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this recipe?")) return;
    await storage.deleteRecipe(id);
    setRecipes(await storage.getRecipes());
  }

  const filtered = filter === "all" ? recipes : recipes.filter((r) => r.category === filter);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sage-400 text-sm">Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-sage-900">Recipes</h1>
          <p className="text-sage-500 mt-2">
            {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} &middot;{" "}
            {recipes.filter((r) => r.category === "main").length} mains &middot;{" "}
            {recipes.filter((r) => r.category === "snack").length} snacks
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-sage-700 text-white rounded-xl text-sm font-medium hover:bg-sage-800 transition-colors shadow-sm"
        >
          {showForm ? "Cancel" : "+ New Recipe"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-sage-100 rounded-2xl p-8 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-sage-800 mb-6">New Recipe</h2>
          <RecipeForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "main", "snack"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? "bg-sage-700 text-white shadow-sm"
                : "bg-sage-100 text-sage-500 hover:bg-sage-200"
            }`}
          >
            {f === "all" ? "All" : f === "main" ? "Main Meals" : "Snacks"}
          </button>
        ))}
      </div>

      {/* Recipe grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sage-400 text-sm">No recipes yet. Add your first one above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white border border-sage-100 rounded-2xl p-6 flex flex-col justify-between group hover:border-sage-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="font-display text-lg font-semibold text-sage-800 hover:text-sage-900 underline-offset-2 hover:underline leading-tight"
                  >
                    {recipe.name}
                  </Link>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="text-sage-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm ml-2 shrink-0"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                    recipe.category === "main"
                      ? "bg-sage-100 text-sage-600"
                      : "bg-warm-100 text-warm-600"
                  }`}>
                    {recipe.category === "main" ? "Main Meal" : "Snack"}
                  </span>
                  <span className="text-xs text-sage-400">
                    {recipe.currentVersion.portionYield} portions
                  </span>
                  <span className="text-sage-200">·</span>
                  <span className="text-xs text-sage-400">
                    {recipe.currentVersion.ingredients.length} ingredients
                  </span>
                </div>

                {recipe.nutrients && (
                  <div className="flex gap-3 text-xs text-sage-400 mb-4">
                    <span>{recipe.nutrients.caloriesPerPortion} kcal</span>
                    <span>P {recipe.nutrients.proteinGrams}g</span>
                    <span>C {recipe.nutrients.carbsGrams}g</span>
                    <span>F {recipe.nutrients.fatGrams}g</span>
                  </div>
                )}

                {recipe.comments.length > 0 && (
                  <p className="text-xs text-sage-400 italic truncate">
                    &ldquo;{recipe.comments[0].text}&rdquo;
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-sage-50 flex items-center justify-between">
                <RatingBadge rating={recipe.rating} />
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="text-xs text-sage-400 hover:text-sage-600 transition-colors"
                >
                  View details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
