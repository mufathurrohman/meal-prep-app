import {
  AIProvider,
  RecipeAnalysisRequest,
  RecipeAnalysisResponse,
  WeeklyPlanAnalysisRequest,
  WeeklyPlanAnalysisResponse,
} from "../types";

// Reuse the same prompt builders — they're provider-agnostic
// In a real project you might extract these to a shared module
const SYSTEM_PROMPT = `You are a meal prep assistant. You analyze recipes and weekly meal plans.
Always respond with valid JSON matching the requested schema. No markdown, no preamble.`;

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || "";
    this.model = process.env.AI_MODEL || "gpt-4o";
  }

  private async call(prompt: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async analyzeRecipe(
    request: RecipeAnalysisRequest,
  ): Promise<RecipeAnalysisResponse> {
    const raw = await this.call(buildRecipePromptForOpenAI(request));
    return JSON.parse(raw);
  }

  async analyzeWeeklyPlan(
    request: WeeklyPlanAnalysisRequest,
  ): Promise<WeeklyPlanAnalysisResponse> {
    const raw = await this.call(buildPlanPromptForOpenAI(request));
    return JSON.parse(raw);
  }
}

// ── Prompt builders (same logic, kept here to avoid circular imports) ──

function buildRecipePromptForOpenAI(request: RecipeAnalysisRequest): string {
  const { recipe, userPrompt, comments } = request;
  const v = recipe.currentVersion;

  let prompt = `Analyze this recipe and suggest improvements.

Recipe: ${recipe.name}
Category: ${recipe.category}
Portions: ${v.portionYield}
Rating: ${recipe.rating || "unrated"}

Ingredients:
${v.ingredients.map((i) => `- ${i.quantity} ${i.unit} ${i.name}`).join("\n")}

Cooking Steps:
${v.cookingSteps.map((s) => `${s.order}. [${s.method}, ${s.durationMinutes}min] ${s.description}`).join("\n")}`;

  if (comments?.length) {
    prompt += `\n\nUser's past comments:\n${comments.map((c) => `- ${c}`).join("\n")}`;
  }
  if (userPrompt) {
    prompt += `\n\nUser's specific question: ${userPrompt}`;
  }

  prompt += `\n\nRespond with JSON:
{
  "suggestions": [{ "suggestion": "...", "rationale": "...", "suggestedChanges": { "ingredients": [...], "cookingSteps": [...], "portionYield": number } }],
  "nutrientEstimate": { "caloriesPerPortion": number, "proteinGrams": number, "carbsGrams": number, "fatGrams": number },
  "uncommonIngredients": ["..."]
}

Rules for suggestedChanges:
- Include it whenever the suggestion involves a concrete recipe edit: ingredient substitution, step modification, or portion change.
- ingredients: provide the COMPLETE updated list (all ingredients with substitutions applied). Each item: { "id": "<copy existing id or generate a new unique string>", "name": "...", "quantity": number, "unit": "...", "isUncommon": false }.
- cookingSteps: provide the COMPLETE updated list. Each item: { "id": "<copy existing id or generate a new unique string>", "order": number, "method": "<boil|sauté|bake|roast|steam|fry|grill|simmer|stir-fry|braise|blanch|other>", "description": "...", "durationMinutes": number }.
- portionYield: include only when the suggestion changes the portion count.
- Omit suggestedChanges only for purely informational observations with no actionable recipe edit.`;

  return prompt;
}

function buildPlanPromptForOpenAI(request: WeeklyPlanAnalysisRequest): string {
  const { plan, recipes } = request;
  const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));

  const slotsByDay: Record<string, string[]> = {};
  for (const slot of plan.slots) {
    if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
    const recipe = slot.recipeId ? recipeMap[slot.recipeId] : null;
    slotsByDay[slot.day].push(
      `  ${slot.slotType}: ${recipe ? recipe.name : "EMPTY"}`,
    );
  }

  const planText = Object.entries(slotsByDay)
    .map(([day, slots]) => `${day}:\n${slots.join("\n")}`)
    .join("\n\n");

  return `Analyze this weekly meal plan for nutritional balance and gaps.

${planText}

Respond with JSON:
{
  "gaps": ["description of empty slots or scheduling issues"],
  "nutritionNotes": ["observations about nutritional balance across the week"]
}`;
}
