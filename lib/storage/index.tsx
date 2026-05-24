"use client";

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { StorageProvider } from "./types";
import { DraftStorageProvider } from "./draft";

interface StorageContextValue {
  storage: StorageProvider;
  hasDirtyChanges: () => boolean;
  getDirtyCounts: () => { recipes: number; plans: number; suggestions: number };
  commitToRemote: () => Promise<{ success: boolean; errors: string[] }>;
  pullFromRemote: () => Promise<{ success: boolean; error?: string }>;
  discardLocalChanges: () => Promise<void>;
  refreshDirtyState: () => void;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const draft = useMemo(() => (mounted ? new DraftStorageProvider() : null), [mounted]);
  const [dirtyTick, setDirtyTick] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshDirtyState = useCallback(() => {
    setDirtyTick((t) => t + 1);
  }, []);

  const wrappedStorage = useMemo<StorageProvider | null>(() => {
    if (!draft) return null;
    return {
      getRecipes: () => draft.getRecipes(),
      getRecipe: (id) => draft.getRecipe(id),
      getWeeklyPlan: (w) => draft.getWeeklyPlan(w),
      getSuggestions: (id) => draft.getSuggestions(id),
      saveRecipe: async (r) => { await draft.saveRecipe(r); refreshDirtyState(); },
      deleteRecipe: async (id) => { await draft.deleteRecipe(id); refreshDirtyState(); },
      saveWeeklyPlan: async (p) => { await draft.saveWeeklyPlan(p); refreshDirtyState(); },
      saveSuggestion: async (s) => { await draft.saveSuggestion(s); refreshDirtyState(); },
      updateSuggestionStatus: async (id, status) => { await draft.updateSuggestionStatus(id, status); refreshDirtyState(); },
    };
  }, [draft, refreshDirtyState]);

  const value = useMemo<StorageContextValue | null>(
    () => {
      if (!draft || !wrappedStorage) return null;
      return {
        storage: wrappedStorage,
        hasDirtyChanges: () => draft.hasDirtyChanges(),
        getDirtyCounts: () => draft.getDirtyCounts(),
        commitToRemote: async () => {
          const result = await draft.commitToRemote();
          refreshDirtyState();
          return result;
        },
        pullFromRemote: async () => {
          const result = await draft.pullFromRemote();
          refreshDirtyState();
          return result;
        },
        discardLocalChanges: async () => {
          await draft.discardLocalChanges();
          refreshDirtyState();
        },
        refreshDirtyState,
      };
    },
    [draft, wrappedStorage, refreshDirtyState, dirtyTick]
  );

  if (!mounted || !value) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sage-400 text-sm">Loading...</p>
      </div>
    );
  }

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

/** Returns the storage provider (reads/writes to local draft) */
export function useStorage(): StorageProvider {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within StorageProviderWrapper");
  return ctx.storage;
}

/** Returns sync controls for draft ↔ Supabase */
export function useSync() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useSync must be used within StorageProviderWrapper");
  return {
    hasDirtyChanges: ctx.hasDirtyChanges,
    getDirtyCounts: ctx.getDirtyCounts,
    commitToRemote: ctx.commitToRemote,
    pullFromRemote: ctx.pullFromRemote,
    discardLocalChanges: ctx.discardLocalChanges,
    refreshDirtyState: ctx.refreshDirtyState,
  };
}
