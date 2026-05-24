import { Recipe, WeeklyPlan, AISuggestion } from "../types";

export interface StorageProvider {
  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | null>;
  saveRecipe(recipe: Recipe): Promise<void>;
  deleteRecipe(id: string): Promise<void>;

  // Weekly Plans
  getWeeklyPlan(weekLabel: string): Promise<WeeklyPlan | null>;
  saveWeeklyPlan(plan: WeeklyPlan): Promise<void>;

  // AI Suggestions
  getSuggestions(recipeId: string): Promise<AISuggestion[]>;
  saveSuggestion(suggestion: AISuggestion): Promise<void>;
  updateSuggestionStatus(id: string, status: AISuggestion["status"]): Promise<void>;
}
