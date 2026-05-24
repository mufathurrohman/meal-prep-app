import {
  AIProvider,
  RecipeAnalysisRequest,
  RecipeAnalysisResponse,
  WeeklyPlanAnalysisRequest,
  WeeklyPlanAnalysisResponse,
} from "../types";

const SYSTEM_PROMPT = `You are a meal prep assistant. You analyze recipes and weekly meal plans.
Always respond with valid JSON matching the requested schema. No markdown, no preamble.`;

function buildRecipePrompt(request: RecipeAnalysisRequest): string {
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
Only include suggestedChanges when the suggestion involves modifying the recipe.`;

  return prompt;
}

function buildPlanPrompt(request: WeeklyPlanAnalysisRequest): string {
  const { plan, recipes } = request;
  const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));

  const slotsByDay: Record<string, string[]> = {};
  for (const slot of plan.slots) {
    if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
    const recipe = slot.recipeId ? recipeMap[slot.recipeId] : null;
    slotsByDay[slot.day].push(`  ${slot.slotType}: ${recipe ? recipe.name : "EMPTY"}`);
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

export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || "";
    this.model = process.env.AI_MODEL || "claude-sonnet-4-20250514";
  }

  private async call(prompt: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("");
  }

  async analyzeRecipe(request: RecipeAnalysisRequest): Promise<RecipeAnalysisResponse> {
    const raw = await this.call(buildRecipePrompt(request));
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  }

  async analyzeWeeklyPlan(request: WeeklyPlanAnalysisRequest): Promise<WeeklyPlanAnalysisResponse> {
    const raw = await this.call(buildPlanPrompt(request));
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  }
}
