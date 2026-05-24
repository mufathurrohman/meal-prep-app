import {
  AIProvider,
  RecipeAnalysisRequest,
  RecipeAnalysisResponse,
  WeeklyPlanAnalysisRequest,
  WeeklyPlanAnalysisResponse,
} from "../types";

const SYSTEM_PROMPT = `You are a meal prep assistant. You analyze recipes and weekly meal plans.
Always respond with valid JSON matching the requested schema. No markdown fences, no preamble, no explanation — only the JSON object.`;

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || "";
    this.model = process.env.AI_MODEL || "gemini-2.5-flash";
  }

  private async call(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error(
        `Gemini returned unexpected response: ${JSON.stringify(data).slice(0, 500)}`
      );
    }

    return data.candidates[0].content.parts[0].text;
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

  prompt += `\n\nRespond with this exact JSON structure:
{
  "suggestions": [
    {
      "suggestion": "short description of the change",
      "rationale": "why this helps",
      "suggestedChanges": {
        "ingredients": [{ "id": "copy existing id or new unique string", "name": "...", "quantity": 0, "unit": "...", "isUncommon": false }],
        "cookingSteps": [{ "id": "copy existing id or new unique string", "order": 1, "method": "boil|sauté|bake|roast|steam|fry|grill|simmer|stir-fry|braise|blanch|other", "description": "...", "durationMinutes": 0 }],
        "portionYield": 0
      }
    }
  ],
  "nutrientEstimate": { "caloriesPerPortion": 0, "proteinGrams": 0, "carbsGrams": 0, "fatGrams": 0 },
  "uncommonIngredients": []
}

Rules for suggestedChanges:
- Include it whenever the suggestion involves a concrete recipe edit: ingredient substitution, step modification, or portion change.
- ingredients: provide the COMPLETE updated list (all ingredients, with substitutions applied). Copy the existing ingredient ids for unchanged ones; generate a new unique string id for any new ingredient.
- cookingSteps: provide the COMPLETE updated list. Copy existing step ids for unchanged steps.
- portionYield: include only when changing the portion count.
- Omit suggestedChanges only for purely informational observations with no actionable recipe edit.
- When suggesting multiple alternatives for the same ingredient or step (e.g., two different fruit substitutions), return each as a separate suggestion entry with its own suggestedChanges — the user will pick one.`;

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

Respond with this exact JSON structure:
{
  "gaps": ["description of scheduling issues"],
  "nutritionNotes": ["observations about nutrition"]
}`;
}
