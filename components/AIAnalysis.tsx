"use client";

import { useState } from "react";
import { Recipe, AISuggestion } from "@/lib/types";
import { generateId } from "@/lib/utils";

interface AIAnalysisProps {
  recipe: Recipe;
  suggestions: AISuggestion[];
  onApprove: (suggestion: AISuggestion) => void;
  onReject: (suggestionId: string) => void;
}

export function AIAnalysis({ recipe, suggestions, onApprove, onReject }: AIAnalysisProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(suggestions);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!prompt.trim() && results.length > 0) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "recipe",
          recipe,
          userPrompt: prompt || undefined,
          comments: recipe.comments.map((c) => c.text),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      const newSuggestions: AISuggestion[] = (data.suggestions || []).map(
        (s: { suggestion: string; rationale: string; suggestedChanges?: object }) => ({
          id: generateId(),
          recipeId: recipe.id,
          suggestion: s.suggestion,
          rationale: s.rationale,
          suggestedChanges: s.suggestedChanges,
          status: "pending" as const,
          createdAt: new Date().toISOString(),
        })
      );

      setResults((prev) => [...newSuggestions, ...prev]);
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze. Check your AI provider configuration in .env.local");
    } finally {
      setLoading(false);
    }
  }

  const pending = results.filter((s) => s.status === "pending");
  const handled = results.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-sage-500 uppercase tracking-wide">AI Recipe Analysis</p>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg border border-sage-200 bg-white text-sage-800 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 placeholder:text-sage-300"
          placeholder="Ask about this recipe... (e.g., how can I make this less dry?)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-4 py-2 bg-warm-500 text-white rounded-lg text-sm font-medium hover:bg-warm-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Pending suggestions */}
      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((s) => (
            <div key={s.id} className="bg-warm-50 border border-warm-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-sage-800">{s.suggestion}</p>
              <p className="text-xs text-sage-500">{s.rationale}</p>

              {s.suggestedChanges && (
                <div className="text-xs text-sage-400 bg-white/60 rounded-lg p-2.5">
                  {s.suggestedChanges.ingredients && (
                    <p>
                      Ingredient changes:{" "}
                      {s.suggestedChanges.ingredients.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(", ")}
                    </p>
                  )}
                  {s.suggestedChanges.cookingSteps && (
                    <p>Step changes: {s.suggestedChanges.cookingSteps.length} step(s) modified</p>
                  )}
                  {s.suggestedChanges.portionYield && (
                    <p>Portion yield → {s.suggestedChanges.portionYield}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {s.suggestedChanges && (
                  <button
                    onClick={() => onApprove(s)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Apply to recipe
                  </button>
                )}
                <button
                  onClick={() => {
                    onReject(s.id);
                    setResults(results.map((r) => (r.id === s.id ? { ...r, status: "rejected" as const } : r)));
                  }}
                  className="px-3 py-1.5 text-sage-400 hover:text-sage-600 text-xs font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {handled.length > 0 && (
        <details className="group">
          <summary className="text-xs text-sage-400 cursor-pointer hover:text-sage-600">
            {handled.length} past suggestion{handled.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-2">
            {handled.map((s) => (
              <div key={s.id} className="text-xs text-sage-400 bg-sage-50 rounded-lg p-3 flex gap-2 items-start">
                <span className={s.status === "approved" ? "text-emerald-500" : "text-sage-300"}>
                  {s.status === "approved" ? "✓" : "✕"}
                </span>
                <span>{s.suggestion}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
