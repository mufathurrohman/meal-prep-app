import { MealSlot, DayOfWeek, MealSlotType } from "./types";

export function generateId(): string {
  return crypto.randomUUID();
}

// ── Week label: ISO week string like "2026-W22" ──

export function getWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function getCurrentWeekLabel(): string {
  return getWeekLabel(new Date());
}

// ── Week navigation: get the Monday of a given ISO week ──

export function getMondayOfWeek(weekLabel: string): Date {
  const [yearStr, weekStr] = weekLabel.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);

  // Jan 4 is always in ISO week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Mon=1 ... Sun=7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

export function getWeekDateSpan(weekLabel: string): string {
  const monday = getMondayOfWeek(weekLabel);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const year = sunday.getFullYear();
  return `${fmt(monday)} – ${fmt(sunday)}, ${year}`;
}

export function shiftWeek(weekLabel: string, offset: number): string {
  const monday = getMondayOfWeek(weekLabel);
  monday.setDate(monday.getDate() + offset * 7);
  return getWeekLabel(monday);
}

// ── Days & Slots ──

export const DAYS: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

export const MEAL_SLOTS: MealSlotType[] = [
  "breakfast",
  "morning-snack",
  "lunch",
  "afternoon-snack",
  "dinner",
  "evening-snack",
];

export const SLOT_LABELS: Record<MealSlotType, string> = {
  breakfast: "Breakfast",
  "morning-snack": "Morning Snack",
  lunch: "Lunch",
  "afternoon-snack": "Afternoon Snack",
  dinner: "Dinner",
  "evening-snack": "Evening Snack",
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function createEmptyWeekSlots(): MealSlot[] {
  const slots: MealSlot[] = [];
  for (const day of DAYS) {
    for (const slotType of MEAL_SLOTS) {
      slots.push({
        id: generateId(),
        day,
        slotType,
      });
    }
  }
  return slots;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
