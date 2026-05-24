import { getSupabase } from "../supabase";
import { Recipe, WeeklyPlan, AISuggestion, RecipeVersion, RecipeComment, Ingredient, CookingStep, NutrientEstimate, MealSlot } from "../types";
import { StorageProvider } from "./types";

// ── Row → App type mappers ──

function rowToRecipe(row: any, versions: any[], comments: any[]): Recipe {
  const currentVersion = versions.find((v) => v.id === row.current_version_id);
  const historyVersions = versions
    .filter((v) => v.id !== row.current_version_id)
    .sort((a, b) => a.version_number - b.version_number);

  const nutrients: NutrientEstimate | undefined =
    row.calories_per_portion != null
      ? {
          caloriesPerPortion: row.calories_per_portion,
          proteinGrams: row.protein_grams,
          carbsGrams: row.carbs_grams,
          fatGrams: row.fat_grams,
        }
      : undefined;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    currentVersion: versionRowToVersion(currentVersion),
    versionHistory: historyVersions.map(versionRowToVersion),
    rating: row.rating || undefined,
    comments: comments
      .filter((c) => c.recipe_id === row.id)
      .map((c) => ({ id: c.id, text: c.text, createdAt: c.created_at }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    nutrients,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function versionRowToVersion(row: any): RecipeVersion {
  return {
    id: row.id,
    versionNumber: row.version_number,
    ingredients: row.ingredients || [],
    cookingSteps: row.cooking_steps || [],
    portionYield: row.portion_yield,
    createdAt: row.created_at,
    changeDescription: row.change_description || undefined,
  };
}

function planRowToPlan(row: any, slotRows: any[]): WeeklyPlan {
  return {
    id: row.id,
    weekLabel: row.week_label,
    notes: row.week_note || undefined,
    slots: slotRows.map((s) => ({
      id: s.id,
      day: s.day,
      slotType: s.slot_type,
      recipeId: s.recipe_id || undefined,
      portionCount: s.portion_count || undefined,
    })),
    createdAt: row.created_at,
  };
}

export class SupabaseProvider implements StorageProvider {
  private db = getSupabase();

  // ── Recipes ──

  async getRecipes(): Promise<Recipe[]> {
    const [{ data: recipes }, { data: versions }, { data: comments }] = await Promise.all([
      this.db.from("recipes").select("*").order("created_at", { ascending: false }),
      this.db.from("recipe_versions").select("*"),
      this.db.from("recipe_comments").select("*"),
    ]);

    if (!recipes || !versions) return [];

    return recipes.map((r) =>
      rowToRecipe(
        r,
        versions.filter((v) => v.recipe_id === r.id),
        comments || []
      )
    );
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    const [{ data: recipe }, { data: versions }, { data: comments }] = await Promise.all([
      this.db.from("recipes").select("*").eq("id", id).single(),
      this.db.from("recipe_versions").select("*").eq("recipe_id", id),
      this.db.from("recipe_comments").select("*").eq("recipe_id", id),
    ]);

    if (!recipe || !versions) return null;
    return rowToRecipe(recipe, versions, comments || []);
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    // 1. Upsert recipe WITHOUT current_version_id to avoid FK violation
    await this.db.from("recipes").upsert({
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      current_version_id: null,
      rating: recipe.rating || null,
      calories_per_portion: recipe.nutrients?.caloriesPerPortion || null,
      protein_grams: recipe.nutrients?.proteinGrams || null,
      carbs_grams: recipe.nutrients?.carbsGrams || null,
      fat_grams: recipe.nutrients?.fatGrams || null,
      created_at: recipe.createdAt,
      updated_at: recipe.updatedAt,
    });

    // 2. Upsert all versions (history + current)
    const allVersions = [...recipe.versionHistory, recipe.currentVersion];
    for (const ver of allVersions) {
      await this.db.from("recipe_versions").upsert({
        id: ver.id,
        recipe_id: recipe.id,
        version_number: ver.versionNumber,
        ingredients: ver.ingredients,
        cooking_steps: ver.cookingSteps,
        portion_yield: ver.portionYield,
        change_description: ver.changeDescription || null,
        created_at: ver.createdAt,
      });
    }

    // 3. Now set current_version_id
    await this.db.from("recipes").update({
      current_version_id: recipe.currentVersion.id,
    }).eq("id", recipe.id);

    // Sync comments: delete existing, re-insert
    await this.db.from("recipe_comments").delete().eq("recipe_id", recipe.id);
    if (recipe.comments.length > 0) {
      await this.db.from("recipe_comments").insert(
        recipe.comments.map((c) => ({
          id: c.id,
          recipe_id: recipe.id,
          text: c.text,
          created_at: c.createdAt,
        }))
      );
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    // Delete in order: comments, versions, slots referencing this recipe, then recipe
    await this.db.from("recipe_comments").delete().eq("recipe_id", id);
    await this.db.from("ai_suggestions").delete().eq("recipe_id", id);
    await this.db.from("meal_slots").update({ recipe_id: null, portion_count: null }).eq("recipe_id", id);
    await this.db.from("recipe_versions").delete().eq("recipe_id", id);
    await this.db.from("recipes").delete().eq("id", id);
  }

  // ── Weekly Plans ──

  async getWeeklyPlan(weekLabel: string): Promise<WeeklyPlan | null> {
    const { data: plan } = await this.db
      .from("weekly_plans")
      .select("*")
      .eq("week_label", weekLabel)
      .single();

    if (!plan) return null;

    const { data: slots } = await this.db
      .from("meal_slots")
      .select("*")
      .eq("plan_id", plan.id);

    return planRowToPlan(plan, slots || []);
  }

  async saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
    // Delete any existing plan for this week (cascade deletes slots)
    await this.db.from("meal_slots").delete().eq(
      "plan_id",
      (await this.db.from("weekly_plans").select("id").eq("week_label", plan.weekLabel).single()).data?.id || plan.id
    ).then(() => {});
    await this.db.from("weekly_plans").delete().eq("week_label", plan.weekLabel);

    // Insert fresh
    await this.db.from("weekly_plans").insert({
      id: plan.id,
      week_label: plan.weekLabel,
      week_note: plan.notes || null,
      created_at: plan.createdAt,
    });

    // Delete existing slots and re-insert
    await this.db.from("meal_slots").delete().eq("plan_id", plan.id);
    if (plan.slots.length > 0) {
      await this.db.from("meal_slots").insert(
        plan.slots.map((s) => ({
          id: s.id,
          plan_id: plan.id,
          day: s.day,
          slot_type: s.slotType,
          recipe_id: s.recipeId || null,
          portion_count: s.portionCount || null,
        }))
      );
    }
  }

  // ── AI Suggestions ──

  async getSuggestions(recipeId: string): Promise<AISuggestion[]> {
    const { data } = await this.db
      .from("ai_suggestions")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("created_at", { ascending: false });

    return (data || []).map((row) => ({
      id: row.id,
      recipeId: row.recipe_id,
      suggestion: row.suggestion,
      rationale: row.rationale,
      suggestedChanges: row.suggested_changes || undefined,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  async saveSuggestion(suggestion: AISuggestion): Promise<void> {
    await this.db.from("ai_suggestions").upsert({
      id: suggestion.id,
      recipe_id: suggestion.recipeId,
      suggestion: suggestion.suggestion,
      rationale: suggestion.rationale,
      suggested_changes: suggestion.suggestedChanges || null,
      status: suggestion.status,
      created_at: suggestion.createdAt,
    });
  }

  async updateSuggestionStatus(id: string, status: AISuggestion["status"]): Promise<void> {
    await this.db.from("ai_suggestions").update({ status }).eq("id", id);
  }
}
