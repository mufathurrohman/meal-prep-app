import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { RecipeAnalysisRequest, WeeklyPlanAnalysisRequest } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    const provider = getAIProvider();

    if (type === "recipe") {
      const analysisRequest: RecipeAnalysisRequest = {
        recipe: body.recipe,
        userPrompt: body.userPrompt,
        comments: body.comments,
      };
      const result = await provider.analyzeRecipe(analysisRequest);
      return NextResponse.json(result);
    }

    if (type === "weekly-plan") {
      const analysisRequest: WeeklyPlanAnalysisRequest = {
        plan: body.plan,
        recipes: body.recipes,
      };
      const result = await provider.analyzeWeeklyPlan(analysisRequest);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Check your AI provider configuration." },
      { status: 500 }
    );
  }
}
