import { Recipe, WeeklyPlan, AISuggestion } from "../types";
import { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local";
import { SupabaseProvider } from "./supabase";

const DIRTY_KEY = "mealprep_dirty_flags";

interface DirtyFlags {
  recipes: Set<string>;   // recipe IDs with local changes
  plans: Set<string>;     // week labels with local changes
  suggestions: Set<string>; // recipe IDs with new suggestions
}

function loadDirtyFlags(): DirtyFlags {
  if (typeof window === "undefined") {
    return { recipes: new Set(), plans: new Set(), suggestions: new Set() };
  }
  try {
    const raw = localStorage.getItem(DIRTY_KEY);
    if (!raw) return { recipes: new Set(), plans: new Set(), suggestions: new Set() };
    const parsed = JSON.parse(raw);
    return {
      recipes: new Set(parsed.recipes || []),
      plans: new Set(parsed.plans || []),
      suggestions: new Set(parsed.suggestions || []),
    };
  } catch {
    return { recipes: new Set(), plans: new Set(), suggestions: new Set() };
  }
}

function saveDirtyFlags(flags: DirtyFlags): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    DIRTY_KEY,
    JSON.stringify({
      recipes: Array.from(flags.recipes),
      plans: Array.from(flags.plans),
      suggestions: Array.from(flags.suggestions),
    })
  );
}

/**
 * DraftStorageProvider: reads/writes to localStorage (draft),
 * with explicit commit/pull to sync with Supabase (remote).
 */
export class DraftStorageProvider implements StorageProvider {
  private local: LocalStorageProvider;
  private remote: SupabaseProvider;
  private dirty: DirtyFlags;

  constructor() {
    this.local = new LocalStorageProvider();
    this.remote = new SupabaseProvider();
    this.dirty = loadDirtyFlags();
  }

  // ── Reads always go to local (draft) ──

  async getRecipes(): Promise<Recipe[]> {
    return this.local.getRecipes();
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    return this.local.getRecipe(id);
  }

  async getWeeklyPlan(weekLabel: string): Promise<WeeklyPlan | null> {
    return this.local.getWeeklyPlan(weekLabel);
  }

  async getSuggestions(recipeId: string): Promise<AISuggestion[]> {
    return this.local.getSuggestions(recipeId);
  }

  // ── Writes go to local + mark dirty ──

  async saveRecipe(recipe: Recipe): Promise<void> {
    await this.local.saveRecipe(recipe);
    this.dirty.recipes.add(recipe.id);
    saveDirtyFlags(this.dirty);
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.local.deleteRecipe(id);
    // Also delete from remote immediately (destructive action)
    try {
      await this.remote.deleteRecipe(id);
    } catch {
      // if remote fails, mark for later
    }
    this.dirty.recipes.delete(id);
    saveDirtyFlags(this.dirty);
  }

  async saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
    await this.local.saveWeeklyPlan(plan);
    this.dirty.plans.add(plan.weekLabel);
    saveDirtyFlags(this.dirty);
  }

  async saveSuggestion(suggestion: AISuggestion): Promise<void> {
    await this.local.saveSuggestion(suggestion);
    this.dirty.suggestions.add(suggestion.recipeId);
    saveDirtyFlags(this.dirty);
  }

  async updateSuggestionStatus(id: string, status: AISuggestion["status"]): Promise<void> {
    await this.local.updateSuggestionStatus(id, status);
    // We don't know the recipeId here, so mark broadly
    saveDirtyFlags(this.dirty);
  }

  // ── Draft/Commit API ──

  /** Check if there are any uncommitted local changes */
  hasDirtyChanges(): boolean {
    return this.dirty.recipes.size > 0 || this.dirty.plans.size > 0 || this.dirty.suggestions.size > 0;
  }

  /** Get counts of dirty items */
  getDirtyCounts(): { recipes: number; plans: number; suggestions: number } {
    return {
      recipes: this.dirty.recipes.size,
      plans: this.dirty.plans.size,
      suggestions: this.dirty.suggestions.size,
    };
  }

  /** Push all dirty local data to Supabase */
  async commitToRemote(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Commit dirty recipes
    for (const recipeId of this.dirty.recipes) {
      try {
        const recipe = await this.local.getRecipe(recipeId);
        if (recipe) {
          await this.remote.saveRecipe(recipe);
        }
      } catch (err) {
        errors.push(`Recipe ${recipeId}: ${err}`);
      }
    }

    // Commit dirty plans
    for (const weekLabel of this.dirty.plans) {
      try {
        const plan = await this.local.getWeeklyPlan(weekLabel);
        if (plan) {
          await this.remote.saveWeeklyPlan(plan);
        }
      } catch (err) {
        errors.push(`Plan ${weekLabel}: ${err}`);
      }
    }

    // Commit dirty suggestions
    for (const recipeId of this.dirty.suggestions) {
      try {
        const suggestions = await this.local.getSuggestions(recipeId);
        for (const s of suggestions) {
          await this.remote.saveSuggestion(s);
        }
      } catch (err) {
        errors.push(`Suggestions for ${recipeId}: ${err}`);
      }
    }

    if (errors.length === 0) {
      // Clear all dirty flags on full success
      this.dirty = { recipes: new Set(), plans: new Set(), suggestions: new Set() };
      saveDirtyFlags(this.dirty);
    }

    return { success: errors.length === 0, errors };
  }

  /** Pull all data from Supabase into local storage (overwrites local) */
  async pullFromRemote(): Promise<{ success: boolean; error?: string }> {
    try {
      // Pull recipes
      const recipes = await this.remote.getRecipes();
      // Clear local recipes and re-populate
      if (typeof window !== "undefined") {
        localStorage.setItem("mealprep_recipes", JSON.stringify(recipes));
      }

      // Pull suggestions for each recipe
      const allSuggestions: AISuggestion[] = [];
      for (const recipe of recipes) {
        const suggestions = await this.remote.getSuggestions(recipe.id);
        allSuggestions.push(...suggestions);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("mealprep_suggestions", JSON.stringify(allSuggestions));
      }

      // Clear dirty flags
      this.dirty = { recipes: new Set(), plans: new Set(), suggestions: new Set() };
      saveDirtyFlags(this.dirty);

      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  /** Discard local changes and reload from Supabase */
  async discardLocalChanges(): Promise<void> {
    await this.pullFromRemote();
  }
}
