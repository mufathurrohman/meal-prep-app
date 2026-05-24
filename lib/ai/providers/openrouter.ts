import {
  AIProvider,
  RecipeAnalysisRequest,
  RecipeAnalysisResponse,
  WeeklyPlanAnalysisRequest,
  WeeklyPlanAnalysisResponse,
} from "../types";

const SYSTEM_PROMPT = `You are a meal prep assistant. You analyze recipes and weekly meal plans.
Always respond with valid JSON matching the requested schema. No markdown, no preamble.`;

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || "";
    this.model = process.env.AI_MODEL || "deepseek/deepseek-chat-v3-0324:free";
  }

  private async call(prompt: string): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async analyzeRecipe(request: RecipeAnalysisRequest): Promise<RecipeAnalysisResponse> {
    const prompt = buildRecipePrompt(request);
    const raw = await this.call(prompt);
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  }

  async analyzeWeeklyPlan(request: WeeklyPlanAnalysisRequest): Promise<WeeklyPlanAnalysisResponse> {
    const prompt = buildPlanPrompt(request);
    const raw = await this.call(prompt);
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  }
}

// ── Prompt builders ──

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

  prompt += `\n\nRespond with JSON only:
{
  "suggestions": [{ "suggestion": "...", "rationale": "...", "suggestedChanges": { "ingredients": [{"id":"...","name":"...","quantity":0,"unit":"..."}], "cookingSteps": [{"id":"...","order":0,"method":"...","description":"...","durationMinutes":0}], "portionYield": number } }],
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

Respond with JSON only:
{
  "gaps": ["description of empty slots or scheduling issues"],
  "nutritionNotes": ["observations about nutritional balance across the week"]
}`;
}
