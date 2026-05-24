"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStorage } from "@/lib/storage";
import { Recipe, AISuggestion, RecipeComment, RecipeVersion } from "@/lib/types";
import { generateId, formatDate } from "@/lib/utils";
import { RecipeForm } from "@/components/RecipeForm";
import { RatingBadge } from "@/components/RatingBadge";
import { NutrientSummary } from "@/components/NutrientSummary";
import { AIAnalysis } from "@/components/AIAnalysis";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storage = useStorage();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [editing, setEditing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loaded, setLoaded] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    async function load() {
      const [r, s] = await Promise.all([
        storage.getRecipe(id),
        storage.getSuggestions(id),
      ]);
      setRecipe(r);
      setSuggestions(s);
      setLoaded(true);
    }
    load();
  }, [id, storage]);

  async function handleSave(updated: Recipe) {
    await storage.saveRecipe(updated);
    setRecipe(updated);
    setEditing(false);
  }

  async function handleRating(rating: Recipe["rating"]) {
    if (!recipe) return;
    const updated = { ...recipe, rating, updatedAt: new Date().toISOString() };
    await storage.saveRecipe(updated);
    setRecipe(updated);
  }

  async function handleAddComment() {
    if (!recipe || !commentText.trim()) return;
    const comment: RecipeComment = {
      id: generateId(),
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...recipe,
      comments: [comment, ...recipe.comments],
      updatedAt: new Date().toISOString(),
    };
    await storage.saveRecipe(updated);
    setRecipe(updated);
    setCommentText("");
  }

  async function handleApprove(suggestion: AISuggestion) {
    if (!recipe) return;
    const changes = suggestion.suggestedChanges;
    if (!changes) return;

    const newVersion: RecipeVersion = {
      id: generateId(),
      versionNumber: recipe.currentVersion.versionNumber + 1,
      ingredients: changes.ingredients || recipe.currentVersion.ingredients,
      cookingSteps: changes.cookingSteps || recipe.currentVersion.cookingSteps,
      portionYield: changes.portionYield || recipe.currentVersion.portionYield,
      createdAt: new Date().toISOString(),
      changeDescription: `AI: ${suggestion.suggestion}`,
    };

    const updated: Recipe = {
      ...recipe,
      currentVersion: newVersion,
      versionHistory: [...recipe.versionHistory, recipe.currentVersion],
      updatedAt: new Date().toISOString(),
    };

    await storage.saveRecipe(updated);
    setRecipe(updated);

    await storage.updateSuggestionStatus(suggestion.id, "approved");
    await storage.saveSuggestion({ ...suggestion, status: "approved" });
    setSuggestions(await storage.getSuggestions(id));
  }

  async function handleRejectSuggestion(suggestionId: string) {
    await storage.updateSuggestionStatus(suggestionId, "rejected");
    setSuggestions(await storage.getSuggestions(id));
  }

  async function handleRevert(version: RecipeVersion) {
    if (!recipe) return;
    if (!confirm(`Revert to version ${version.versionNumber}?`)) return;

    const updated: Recipe = {
      ...recipe,
      currentVersion: { ...version, versionNumber: recipe.currentVersion.versionNumber + 1 },
      versionHistory: [...recipe.versionHistory, recipe.currentVersion],
      updatedAt: new Date().toISOString(),
    };
    await storage.saveRecipe(updated);
    setRecipe(updated);
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sage-400 text-sm">Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-20">
        <p className="text-sage-500 text-lg">Recipe not found.</p>
        <button onClick={() => router.push("/recipes")} className="text-sm text-sage-400 hover:text-sage-600 mt-3">
          ← Back to recipes
        </button>
      </div>
    );
  }

  const v = recipe.currentVersion;
  const totalTime = v.cookingSteps.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/recipes")}
          className="text-sm text-sage-400 hover:text-sage-600 mb-4 inline-block transition-colors"
        >
          ← Back to Recipes
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-sage-900">{recipe.name}</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                recipe.category === "main"
                  ? "bg-sage-100 text-sage-600"
                  : "bg-warm-100 text-warm-600"
              }`}>
                {recipe.category === "main" ? "Main Meal" : "Snack"}
              </span>
              <span className="text-sm text-sage-400">{v.portionYield} portions</span>
              <span className="text-sage-200">·</span>
              <span className="text-sm text-sage-400">{totalTime} min total</span>
              <span className="text-sage-200">·</span>
              <span className="text-sm text-sage-400">v{v.versionNumber}</span>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 border border-sage-300 rounded-xl text-sm font-medium text-sage-600 hover:bg-sage-50 transition-colors"
          >
            {editing ? "Cancel Edit" : "Edit Recipe"}
          </button>
        </div>
      </div>

      {/* Edit mode */}
      {editing && (
        <div className="bg-white border border-sage-100 rounded-2xl p-8 shadow-sm">
          <RecipeForm initial={recipe} onSave={handleSave} onCancel={() => setEditing(false)} />
        </div>
      )}

      {/* View mode */}
      {!editing && (
        <>
          {/* Rating */}
          <div>
            <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider mb-3">Rating</p>
            <RatingBadge rating={recipe.rating} interactive onSelect={handleRating} />
          </div>

          {/* Nutrients */}
          {recipe.nutrients && (
            <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-sm">
              <NutrientSummary nutrients={recipe.nutrients} />
            </div>
          )}

          {/* Two-column: Ingredients + Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ingredients */}
            <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider mb-4">
                Ingredients ({v.ingredients.length})
              </p>
              <ul className="space-y-2.5">
                {v.ingredients.map((ing) => (
                  <li key={ing.id} className="text-sm text-sage-700 flex items-baseline gap-3">
                    <span className="font-semibold text-sage-800 tabular-nums min-w-[60px] text-right shrink-0">
                      {ing.quantity} {ing.unit}
                    </span>
                    <span>{ing.name}</span>
                    {ing.isUncommon && (
                      <span className="text-[10px] bg-warm-100 text-warm-600 px-2 py-0.5 rounded-full font-medium shrink-0">
                        uncommon
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cooking Steps */}
            <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider mb-4">
                Cooking Steps ({v.cookingSteps.length})
              </p>
              <ol className="space-y-4">
                {v.cookingSteps.map((step) => (
                  <li key={step.id} className="flex gap-4 text-sm">
                    <span className="text-sage-300 font-semibold text-lg leading-tight shrink-0 w-6 text-right">
                      {step.order}
                    </span>
                    <div className="flex-1">
                      <p className="text-sage-700 leading-relaxed">{step.description}</p>
                      <p className="text-xs text-sage-400 mt-1.5">
                        <span className="inline-block bg-sage-50 px-2 py-0.5 rounded-md mr-2">{step.method}</span>
                        {step.durationMinutes > 0 && <span>{step.durationMinutes} min</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-5 pt-4 border-t border-sage-100 text-sm text-sage-400">
                Total cooking time: <span className="font-medium text-sage-600">{totalTime} minutes</span>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-sm">
            <AIAnalysis
              recipe={recipe}
              suggestions={suggestions}
              onApprove={handleApprove}
              onReject={handleRejectSuggestion}
            />
          </div>

          {/* Comments */}
          <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-sm space-y-5">
            <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider">Notes & Commentary</p>
            <div className="flex gap-3">
              <input
                className="flex-1 px-4 py-3 rounded-xl border border-sage-200 bg-sage-50/30 text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent placeholder:text-sage-300"
                placeholder="Add a note... (e.g., try adding paprika next time)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                className="px-5 py-3 bg-sage-100 text-sage-600 rounded-xl text-sm font-medium hover:bg-sage-200 transition-colors"
              >
                Add
              </button>
            </div>
            {recipe.comments.length > 0 && (
              <div className="space-y-3">
                {recipe.comments.map((c) => (
                  <div key={c.id} className="text-sm text-sage-600 bg-sage-50/50 rounded-xl px-5 py-3">
                    <p className="leading-relaxed">{c.text}</p>
                    <p className="text-[11px] text-sage-300 mt-2">{formatDate(c.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Version History */}
          {recipe.versionHistory.length > 0 && (
            <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider mb-4">Version History</p>
              <div className="space-y-3">
                {[...recipe.versionHistory].reverse().map((ver) => (
                  <div key={ver.id} className="flex items-center justify-between text-sm py-2.5 border-b border-sage-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sage-600 font-medium">v{ver.versionNumber}</span>
                      {ver.changeDescription && (
                        <span className="text-sage-400 text-xs">{ver.changeDescription}</span>
                      )}
                      <span className="text-sage-300 text-xs">{formatDate(ver.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => handleRevert(ver)}
                      className="text-xs text-sage-400 hover:text-sage-600 transition-colors px-3 py-1 rounded-lg hover:bg-sage-50"
                    >
                      Revert
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
