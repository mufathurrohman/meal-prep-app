"use client";

import { useEffect, useState } from "react";
import { Recipe, AISuggestion } from "@/lib/types";
import { generateId } from "@/lib/utils";

interface AIAnalysisProps {
  recipe: Recipe;
  suggestions: AISuggestion[];
  onApprove: (suggestion: AISuggestion) => void;
  onReject: (suggestionId: string) => void;
  onApproveAll: (suggestions: AISuggestion[]) => Promise<void>;
}

export function AIAnalysis({ recipe, suggestions, onApprove, onReject, onApproveAll }: AIAnalysisProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(suggestions);
  const [error, setError] = useState<string | null>(null);
  const [applyPrompt, setApplyPrompt] = useState<AISuggestion[] | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: "success" | "info" } | null>(null);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

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

      const actionable = newSuggestions.filter((s) => s.suggestedChanges);
      if (actionable.length > 0) {
        setApplyPrompt(actionable);
        setSelectedPromptId(actionable[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze. Check your AI provider configuration in .env.local");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyChosen() {
    if (!applyPrompt || !selectedPromptId) return;
    const chosen = applyPrompt.find((s) => s.id === selectedPromptId);
    if (!chosen) return;
    const unchosenIds = new Set(applyPrompt.filter((s) => s.id !== chosen.id).map((s) => s.id));
    await onApproveAll([chosen]);
    setResults((prev) =>
      prev.map((r) => {
        if (r.id === chosen.id) return { ...r, status: "approved" as const };
        if (unchosenIds.has(r.id)) return { ...r, status: "rejected" as const };
        return r;
      })
    );
    setApplyPrompt(null);
    setNotification({ text: `Recipe updated: "${chosen.suggestion}"`, type: "success" });
  }

  function handleDeclineAll() {
    setApplyPrompt(null);
    setNotification({ text: "Got it! You can still apply individual suggestions below.", type: "info" });
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

      {/* Notification toast */}
      {notification && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-sage-50 text-sage-600 border border-sage-200"
          }`}
        >
          <span>{notification.type === "success" ? "✓" : "ℹ"}</span>
          {notification.text}
        </div>
      )}

      {/* Apply prompt */}
      {applyPrompt && (
        <div className="bg-warm-50 border border-warm-300 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-sage-800">
            {applyPrompt.length === 1
              ? "Would you like to apply this suggestion to the recipe?"
              : "Which improvement would you like to apply?"}
          </p>

          {/* Single suggestion — just show the title */}
          {applyPrompt.length === 1 && (
            <p className="text-xs text-sage-600 bg-white/70 rounded-lg px-3 py-2">
              {applyPrompt[0].suggestion}
            </p>
          )}

          {/* Multiple suggestions — radio list */}
          {applyPrompt.length > 1 && (
            <div className="space-y-2">
              {applyPrompt.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer border transition-colors ${
                    selectedPromptId === s.id
                      ? "bg-white border-warm-400"
                      : "bg-white/50 border-transparent hover:bg-white/80"
                  }`}
                >
                  <input
                    type="radio"
                    name="apply-suggestion"
                    value={s.id}
                    checked={selectedPromptId === s.id}
                    onChange={() => setSelectedPromptId(s.id)}
                    className="mt-0.5 accent-emerald-600 shrink-0"
                  />
                  <span className="text-xs text-sage-700">{s.suggestion}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleApplyChosen}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              {applyPrompt.length === 1 ? "Yes, apply it" : "Apply selected"}
            </button>
            <button
              onClick={handleDeclineAll}
              className="px-4 py-2 bg-white border border-sage-200 text-sage-500 rounded-lg text-xs font-medium hover:bg-sage-50 transition-colors"
            >
              {applyPrompt.length === 1 ? "No, not now" : "None of these"}
            </button>
          </div>
        </div>
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
