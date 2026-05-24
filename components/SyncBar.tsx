"use client";

import { useState } from "react";
import { useSync } from "@/lib/storage";

export function SyncBar() {
  const { hasDirtyChanges, getDirtyCounts, commitToRemote, pullFromRemote, discardLocalChanges } =
    useSync();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const dirty = hasDirtyChanges();
  const counts = getDirtyCounts();

  async function handleCommit() {
    setSyncing(true);
    setMessage(null);
    const result = await commitToRemote();
    if (result.success) {
      setMessage({ text: "Saved to database", type: "success" });
    } else {
      setMessage({ text: `Errors: ${result.errors.join(", ")}`, type: "error" });
    }
    setSyncing(false);
    setTimeout(() => setMessage(null), 4000);
  }

  async function handlePull() {
    if (dirty && !confirm("This will overwrite your local draft with data from the database. Continue?")) return;
    setSyncing(true);
    setMessage(null);
    const result = await pullFromRemote();
    if (result.success) {
      setMessage({ text: "Loaded from database", type: "success" });
      window.location.reload();
    } else {
      setMessage({ text: `Pull failed: ${result.error}`, type: "error" });
    }
    setSyncing(false);
  }

  async function handleDiscard() {
    if (!confirm("Discard all local changes and reload from database?")) return;
    setSyncing(true);
    await discardLocalChanges();
    window.location.reload();
  }

  function getDirtySummary(): string {
    const parts: string[] = [];
    if (counts.recipes > 0) parts.push(`${counts.recipes} recipe${counts.recipes > 1 ? "s" : ""}`);
    if (counts.plans > 0) parts.push(`${counts.plans} plan${counts.plans > 1 ? "s" : ""}`);
    if (counts.suggestions > 0) parts.push(`${counts.suggestions} suggestion set${counts.suggestions > 1 ? "s" : ""}`);
    return parts.join(", ");
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status message */}
      {message && (
        <span
          className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-500"
          }`}
        >
          {message.text}
        </span>
      )}

      {/* Dirty indicator */}
      {dirty && (
        <span className="text-xs text-warm-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warm-400 animate-pulse" />
          Unsaved: {getDirtySummary()}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCommit}
          disabled={syncing || !dirty}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            dirty
              ? "bg-sage-700 text-white hover:bg-sage-800"
              : "bg-sage-100 text-sage-300 cursor-not-allowed"
          } disabled:opacity-50`}
          title="Save local changes to Supabase"
        >
          {syncing ? "Saving..." : "Save to DB"}
        </button>

        <button
          onClick={handlePull}
          disabled={syncing}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-sage-200 text-sage-500 hover:bg-sage-50 transition-colors disabled:opacity-50"
          title="Load latest data from Supabase"
        >
          Pull from DB
        </button>

        {dirty && (
          <button
            onClick={handleDiscard}
            disabled={syncing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-sage-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Discard local changes"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  );
}
