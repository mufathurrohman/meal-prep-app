import { Recipe, WeeklyPlan } from "./types";
import { generateId, createEmptyWeekSlots, getCurrentWeekLabel } from "./utils";

function id() {
  return generateId();
}

const now = new Date().toISOString();

export const SEED_RECIPES: Recipe[] = [
  {
    id: "seed-chicken-stirfry",
    name: "Garlic Chicken Stir-Fry",
    category: "main",
    currentVersion: {
      id: id(),
      versionNumber: 2,
      ingredients: [
        { id: id(), name: "chicken breast", quantity: 600, unit: "g" },
        { id: id(), name: "broccoli florets", quantity: 300, unit: "g" },
        { id: id(), name: "bell pepper (red)", quantity: 2, unit: "pcs" },
        { id: id(), name: "garlic cloves", quantity: 5, unit: "pcs" },
        { id: id(), name: "soy sauce", quantity: 3, unit: "tbsp" },
        { id: id(), name: "sesame oil", quantity: 1, unit: "tbsp" },
        { id: id(), name: "oyster sauce", quantity: 2, unit: "tbsp" },
        { id: id(), name: "cornstarch", quantity: 1, unit: "tbsp" },
        { id: id(), name: "jasmine rice", quantity: 400, unit: "g" },
        { id: id(), name: "vegetable oil", quantity: 2, unit: "tbsp" },
      ],
      cookingSteps: [
        { id: id(), order: 1, method: "boil", description: "Cook jasmine rice according to package instructions", durationMinutes: 15 },
        { id: id(), order: 2, method: "other", description: "Slice chicken into thin strips, toss with cornstarch and 1 tbsp soy sauce", durationMinutes: 5 },
        { id: id(), order: 3, method: "stir-fry", description: "Heat oil in wok on high heat, sear chicken until golden. Remove and set aside", durationMinutes: 5 },
        { id: id(), order: 4, method: "stir-fry", description: "In same wok, stir-fry broccoli and bell pepper for 3 minutes until tender-crisp", durationMinutes: 3 },
        { id: id(), order: 5, method: "sauté", description: "Add garlic, cook 30 seconds. Return chicken, add oyster sauce, remaining soy sauce, and sesame oil. Toss to combine", durationMinutes: 2 },
      ],
      portionYield: 5,
      createdAt: now,
      changeDescription: "Increased garlic from 3 to 5 cloves for more flavour",
    },
    versionHistory: [
      {
        id: id(),
        versionNumber: 1,
        ingredients: [
          { id: id(), name: "chicken breast", quantity: 600, unit: "g" },
          { id: id(), name: "broccoli florets", quantity: 300, unit: "g" },
          { id: id(), name: "bell pepper (red)", quantity: 2, unit: "pcs" },
          { id: id(), name: "garlic cloves", quantity: 3, unit: "pcs" },
          { id: id(), name: "soy sauce", quantity: 3, unit: "tbsp" },
          { id: id(), name: "sesame oil", quantity: 1, unit: "tbsp" },
          { id: id(), name: "oyster sauce", quantity: 2, unit: "tbsp" },
          { id: id(), name: "cornstarch", quantity: 1, unit: "tbsp" },
          { id: id(), name: "jasmine rice", quantity: 400, unit: "g" },
          { id: id(), name: "vegetable oil", quantity: 2, unit: "tbsp" },
        ],
        cookingSteps: [
          { id: id(), order: 1, method: "boil", description: "Cook jasmine rice", durationMinutes: 15 },
          { id: id(), order: 2, method: "other", description: "Slice chicken, toss with cornstarch and soy sauce", durationMinutes: 5 },
          { id: id(), order: 3, method: "stir-fry", description: "Sear chicken in hot oil", durationMinutes: 5 },
          { id: id(), order: 4, method: "stir-fry", description: "Cook vegetables", durationMinutes: 3 },
          { id: id(), order: 5, method: "sauté", description: "Combine everything with sauces", durationMinutes: 2 },
        ],
        portionYield: 5,
        createdAt: now,
      },
    ],
    rating: "will-eat-again",
    comments: [
      { id: id(), text: "Added more garlic in v2 — much better. Could try adding ginger next time.", createdAt: now },
      { id: id(), text: "Freezes well for 5 days. Reheat with a splash of water to keep it moist.", createdAt: now },
    ],
    nutrients: { caloriesPerPortion: 420, proteinGrams: 38, carbsGrams: 45, fatGrams: 10 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "seed-pasta-bolognese",
    name: "Turkey Bolognese Pasta",
    category: "main",
    currentVersion: {
      id: id(),
      versionNumber: 1,
      ingredients: [
        { id: id(), name: "ground turkey", quantity: 500, unit: "g" },
        { id: id(), name: "penne pasta", quantity: 400, unit: "g" },
        { id: id(), name: "crushed tomatoes (canned)", quantity: 400, unit: "g" },
        { id: id(), name: "onion (diced)", quantity: 1, unit: "pcs" },
        { id: id(), name: "carrot (grated)", quantity: 2, unit: "pcs" },
        { id: id(), name: "celery stalk (diced)", quantity: 2, unit: "pcs" },
        { id: id(), name: "garlic cloves", quantity: 3, unit: "pcs" },
        { id: id(), name: "dried oregano", quantity: 1, unit: "tsp" },
        { id: id(), name: "olive oil", quantity: 2, unit: "tbsp" },
        { id: id(), name: "salt", quantity: 1, unit: "tsp" },
      ],
      cookingSteps: [
        { id: id(), order: 1, method: "sauté", description: "Heat olive oil, cook onion, carrot, and celery until softened", durationMinutes: 7 },
        { id: id(), order: 2, method: "sauté", description: "Add garlic, cook for 1 minute until fragrant", durationMinutes: 1 },
        { id: id(), order: 3, method: "sauté", description: "Add ground turkey, break apart, cook until no longer pink", durationMinutes: 8 },
        { id: id(), order: 4, method: "simmer", description: "Add crushed tomatoes, oregano, and salt. Simmer on low heat", durationMinutes: 25 },
        { id: id(), order: 5, method: "boil", description: "Cook penne in salted water until al dente, drain", durationMinutes: 10 },
        { id: id(), order: 6, method: "other", description: "Toss pasta with sauce. Portion into containers", durationMinutes: 3 },
      ],
      portionYield: 5,
      createdAt: now,
    },
    versionHistory: [],
    rating: "need-to-modify",
    comments: [
      { id: id(), text: "Sauce was a bit thin — try adding tomato paste next time for thicker consistency.", createdAt: now },
    ],
    nutrients: { caloriesPerPortion: 480, proteinGrams: 32, carbsGrams: 55, fatGrams: 12 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "seed-lentil-soup",
    name: "Red Lentil & Sweet Potato Soup",
    category: "main",
    currentVersion: {
      id: id(),
      versionNumber: 1,
      ingredients: [
        { id: id(), name: "red lentils", quantity: 300, unit: "g" },
        { id: id(), name: "sweet potato (cubed)", quantity: 2, unit: "pcs" },
        { id: id(), name: "onion (diced)", quantity: 1, unit: "pcs" },
        { id: id(), name: "garlic cloves", quantity: 3, unit: "pcs" },
        { id: id(), name: "vegetable broth", quantity: 1, unit: "l" },
        { id: id(), name: "coconut milk", quantity: 200, unit: "ml" },
        { id: id(), name: "cumin", quantity: 1, unit: "tsp" },
        { id: id(), name: "turmeric", quantity: 0.5, unit: "tsp", isUncommon: true },
        { id: id(), name: "smoked paprika", quantity: 1, unit: "tsp" },
        { id: id(), name: "olive oil", quantity: 1, unit: "tbsp" },
      ],
      cookingSteps: [
        { id: id(), order: 1, method: "sauté", description: "Cook onion and garlic in olive oil until soft", durationMinutes: 5 },
        { id: id(), order: 2, method: "sauté", description: "Add cumin, turmeric, and paprika. Stir for 30 seconds", durationMinutes: 1 },
        { id: id(), order: 3, method: "simmer", description: "Add lentils, sweet potato, and broth. Bring to boil, then simmer until lentils are soft", durationMinutes: 25 },
        { id: id(), order: 4, method: "other", description: "Blend half the soup for a chunky texture, or fully for smooth. Stir in coconut milk", durationMinutes: 3 },
      ],
      portionYield: 6,
      createdAt: now,
    },
    versionHistory: [],
    rating: "will-eat-again",
    comments: [
      { id: id(), text: "Great freezer meal. Keeps well for the full week.", createdAt: now },
      { id: id(), text: "The turmeric is key — don't skip it. Order ahead if needed.", createdAt: now },
    ],
    nutrients: { caloriesPerPortion: 310, proteinGrams: 14, carbsGrams: 48, fatGrams: 8 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "seed-overnight-oats",
    name: "Peanut Butter Overnight Oats",
    category: "main",
    currentVersion: {
      id: id(),
      versionNumber: 1,
      ingredients: [
        { id: id(), name: "rolled oats", quantity: 400, unit: "g" },
        { id: id(), name: "milk (any)", quantity: 500, unit: "ml" },
        { id: id(), name: "Greek yogurt", quantity: 250, unit: "g" },
        { id: id(), name: "peanut butter", quantity: 5, unit: "tbsp" },
        { id: id(), name: "honey", quantity: 3, unit: "tbsp" },
        { id: id(), name: "chia seeds", quantity: 3, unit: "tbsp" },
        { id: id(), name: "banana", quantity: 3, unit: "pcs" },
      ],
      cookingSteps: [
        { id: id(), order: 1, method: "other", description: "Mix oats, milk, yogurt, peanut butter, honey, and chia seeds in a large bowl", durationMinutes: 5 },
        { id: id(), order: 2, method: "other", description: "Divide into 5 jars or containers. Slice banana on top", durationMinutes: 5 },
        { id: id(), order: 3, method: "other", description: "Refrigerate overnight (minimum 4 hours)", durationMinutes: 0 },
      ],
      portionYield: 5,
      createdAt: now,
    },
    versionHistory: [],
    rating: "will-eat-again",
    comments: [],
    nutrients: { caloriesPerPortion: 380, proteinGrams: 16, carbsGrams: 52, fatGrams: 13 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "seed-trail-mix",
    name: "Homemade Trail Mix",
    category: "snack",
    currentVersion: {
      id: id(),
      versionNumber: 1,
      ingredients: [
        { id: id(), name: "almonds", quantity: 150, unit: "g" },
        { id: id(), name: "cashews", quantity: 100, unit: "g" },
        { id: id(), name: "dark chocolate chips", quantity: 80, unit: "g" },
        { id: id(), name: "dried cranberries", quantity: 80, unit: "g" },
        { id: id(), name: "pumpkin seeds", quantity: 50, unit: "g" },
      ],
      cookingSteps: [
        { id: id(), order: 1, method: "other", description: "Mix all ingredients together in a large bowl", durationMinutes: 2 },
        { id: id(), order: 2, method: "other", description: "Divide into 10 small bags or containers (about 45g each)", durationMinutes: 5 },
      ],
      portionYield: 10,
      createdAt: now,
    },
    versionHistory: [],
    rating: "will-eat-again",
    comments: [
      { id: id(), text: "Easy to make in bulk. Lasts the whole week no problem.", createdAt: now },
    ],
    nutrients: { caloriesPerPortion: 195, proteinGrams: 6, carbsGrams: 15, fatGrams: 13 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "seed-energy-balls",
    name: "Date & Oat Energy Balls",
    category: "snack",
    currentVersion: {
      id: id(),
      versionNumber: 1,
      ingredients: [
        { id: id(), name: "Medjool dates (pitted)", quantity: 200, unit: "g" },
        { id: id(), name: "rolled oats", quantity: 100, unit: "g" },
        { id: id(), name: "peanut butter", quantity: 3, unit: "tbsp" },
        { id: id(), name: "cocoa powder", quantity: 2, unit: "tbsp" },
        { id: id(), name: "desiccated coconut", quantity: 30, unit: "g" },
      ],
      cookingSteps: [
        { id: id(), order: 1, method: "other", description: "Blend dates in a food processor until a sticky paste forms", durationMinutes: 2 },
        { id: id(), order: 2, method: "other", description: "Add oats, peanut butter, and cocoa. Pulse until combined", durationMinutes: 2 },
        { id: id(), order: 3, method: "other", description: "Roll into small balls (about 20), coat with coconut. Refrigerate for 1 hour", durationMinutes: 10 },
      ],
      portionYield: 10,
      createdAt: now,
    },
    versionHistory: [],
    rating: undefined,
    comments: [],
    nutrients: { caloriesPerPortion: 120, proteinGrams: 3, carbsGrams: 18, fatGrams: 5 },
    createdAt: now,
    updatedAt: now,
  },
];

export function createSeededWeeklyPlan(): WeeklyPlan {
  const slots = createEmptyWeekSlots();

  const assignments: Record<string, Record<string, string>> = {
    monday: {
      breakfast: "seed-overnight-oats",
      "morning-snack": "seed-trail-mix",
      lunch: "seed-chicken-stirfry",
      "afternoon-snack": "seed-energy-balls",
      dinner: "seed-lentil-soup",
    },
    tuesday: {
      breakfast: "seed-overnight-oats",
      lunch: "seed-pasta-bolognese",
      "afternoon-snack": "seed-trail-mix",
      dinner: "seed-chicken-stirfry",
    },
    wednesday: {
      breakfast: "seed-overnight-oats",
      "morning-snack": "seed-energy-balls",
      lunch: "seed-lentil-soup",
      dinner: "seed-pasta-bolognese",
      "evening-snack": "seed-trail-mix",
    },
    thursday: {
      breakfast: "seed-overnight-oats",
      lunch: "seed-chicken-stirfry",
      "afternoon-snack": "seed-energy-balls",
      dinner: "seed-lentil-soup",
    },
    friday: {
      breakfast: "seed-overnight-oats",
      "morning-snack": "seed-trail-mix",
      lunch: "seed-pasta-bolognese",
      "afternoon-snack": "seed-energy-balls",
      dinner: "seed-chicken-stirfry",
    },
  };

  for (const slot of slots) {
    const dayAssignments = assignments[slot.day];
    if (dayAssignments && dayAssignments[slot.slotType]) {
      slot.recipeId = dayAssignments[slot.slotType];
      slot.portionCount = 1;
    }
  }

  return {
    id: generateId(),
    weekLabel: getCurrentWeekLabel(),
    slots,
    createdAt: now,
  };
}
