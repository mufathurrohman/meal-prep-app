import { Recipe, AISuggestion, NutrientEstimate, WeeklyPlan } from "../types";

export interface RecipeAnalysisRequest {
  recipe: Recipe;
  userPrompt?: string; // specific question from the user
  comments?: string[]; // past commentary for context
}

export interface RecipeAnalysisResponse {
  suggestions: Omit<AISuggestion, "id" | "recipeId" | "status" | "createdAt">[];
  nutrientEstimate?: NutrientEstimate;
  uncommonIngredients?: string[];
}

export interface WeeklyPlanAnalysisRequest {
  plan: WeeklyPlan;
  recipes: Recipe[];
}

export interface WeeklyPlanAnalysisResponse {
  gaps: string[]; // e.g. "No afternoon snack on Wednesday"
  nutritionNotes: string[]; // e.g. "Week is low on fiber"
}

export interface AIProvider {
  analyzeRecipe(request: RecipeAnalysisRequest): Promise<RecipeAnalysisResponse>;
  analyzeWeeklyPlan(request: WeeklyPlanAnalysisRequest): Promise<WeeklyPlanAnalysisResponse>;
}
