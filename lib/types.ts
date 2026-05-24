// ──────────────────────────────────────────
// Recipe & Ingredients
// ──────────────────────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isUncommon?: boolean; // flagged by AI or user
}

export interface CookingStep {
  id: string;
  order: number;
  method: CookingMethod;
  description: string;
  durationMinutes: number;
}

export type CookingMethod =
  | "boil"
  | "sauté"
  | "bake"
  | "roast"
  | "steam"
  | "fry"
  | "grill"
  | "simmer"
  | "stir-fry"
  | "braise"
  | "blanch"
  | "other";

export type Rating = "will-eat-again" | "need-to-modify" | "not-recommended";

export type MealCategory = "main" | "snack";

export interface RecipeComment {
  id: string;
  text: string;
  createdAt: string; // ISO date
}

export interface RecipeVersion {
  id: string;
  versionNumber: number;
  ingredients: Ingredient[];
  cookingSteps: CookingStep[];
  portionYield: number;
  createdAt: string;
  changeDescription?: string; // e.g. "AI: reduced bake time by 5 min"
}

export interface NutrientEstimate {
  caloriesPerPortion: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: MealCategory;
  currentVersion: RecipeVersion;
  versionHistory: RecipeVersion[];
  rating?: Rating;
  comments: RecipeComment[];
  nutrients?: NutrientEstimate;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────
// Weekly Plan & Scheduling
// ──────────────────────────────────────────

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type MealSlotType =
  | "breakfast"
  | "morning-snack"
  | "lunch"
  | "afternoon-snack"
  | "dinner"
  | "evening-snack";

export interface MealSlot {
  id: string;
  day: DayOfWeek;
  slotType: MealSlotType;
  recipeId?: string;
  portionCount?: number;
}

export interface WeeklyPlan {
  id: string;
  weekLabel: string; // e.g. "2026-W22"
  slots: MealSlot[];
  notes?: string;
  createdAt: string;
}

// ──────────────────────────────────────────
// AI Analysis
// ──────────────────────────────────────────

export interface AISuggestion {
  id: string;
  recipeId: string;
  suggestion: string;
  rationale: string;
  suggestedChanges?: {
    ingredients?: Ingredient[];
    cookingSteps?: CookingStep[];
    portionYield?: number;
  };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
