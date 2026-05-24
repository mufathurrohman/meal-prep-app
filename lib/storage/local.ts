import { Recipe, WeeklyPlan, AISuggestion } from "../types";
import { StorageProvider } from "./types";
import { SEED_RECIPES, createSeededWeeklyPlan } from "../seed";

const KEYS = {
  recipes: "mealprep_recipes",
  plans: "mealprep_plans",
  suggestions: "mealprep_suggestions",
  seeded: "mealprep_seeded_v3",
};

function getItem<T>(key: string): T {
  if (typeof window === "undefined") return [] as unknown as T;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : ([] as unknown as T);
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export class LocalStorageProvider implements StorageProvider {
  constructor() {
    if (typeof window !== "undefined" && !localStorage.getItem(KEYS.seeded)) {
      setItem(KEYS.recipes, SEED_RECIPES);
      setItem(KEYS.plans, [createSeededWeeklyPlan()]);
      localStorage.setItem(KEYS.seeded, "true");
    }
  }

  // ── Recipes ──

  async getRecipes(): Promise<Recipe[]> {
    return getItem<Recipe[]>(KEYS.recipes);
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    const recipes = await this.getRecipes();
    return recipes.find((r) => r.id === id) || null;
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    const recipes = await this.getRecipes();
    const index = recipes.findIndex((r) => r.id === recipe.id);
    if (index >= 0) {
      recipes[index] = recipe;
    } else {
      recipes.push(recipe);
    }
    setItem(KEYS.recipes, recipes);
  }

  async deleteRecipe(id: string): Promise<void> {
    const recipes = await this.getRecipes();
    setItem(
      KEYS.recipes,
      recipes.filter((r) => r.id !== id)
    );
  }

  // ── Weekly Plans ──

  async getWeeklyPlan(weekLabel: string): Promise<WeeklyPlan | null> {
    const plans = getItem<WeeklyPlan[]>(KEYS.plans);
    return plans.find((p) => p.weekLabel === weekLabel) || null;
  }

  async saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
    const plans = getItem<WeeklyPlan[]>(KEYS.plans);
    const index = plans.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.push(plan);
    }
    setItem(KEYS.plans, plans);
  }

  // ── AI Suggestions ──

  async getSuggestions(recipeId: string): Promise<AISuggestion[]> {
    const all = getItem<AISuggestion[]>(KEYS.suggestions);
    return all.filter((s) => s.recipeId === recipeId);
  }

  async saveSuggestion(suggestion: AISuggestion): Promise<void> {
    const all = getItem<AISuggestion[]>(KEYS.suggestions);
    all.push(suggestion);
    setItem(KEYS.suggestions, all);
  }

  async updateSuggestionStatus(id: string, status: AISuggestion["status"]): Promise<void> {
    const all = getItem<AISuggestion[]>(KEYS.suggestions);
    const suggestion = all.find((s) => s.id === id);
    if (suggestion) {
      suggestion.status = status;
      setItem(KEYS.suggestions, all);
    }
  }
}
