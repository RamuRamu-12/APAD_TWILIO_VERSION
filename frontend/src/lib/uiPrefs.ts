const INTERESTS_KEY = "apad_interests";

export const INTEREST_CATEGORIES = [
  { name: "Tech & Gaming", emoji: "💻" },
  { name: "Fashion & Lifestyle", emoji: "👗" },
  { name: "Finance & Investing", emoji: "📈" },
  { name: "Travel & Wellness", emoji: "✈️" },
  { name: "Education & Careers", emoji: "🎓" },
  { name: "Beauty & Cosmetics", emoji: "💄" },
  { name: "Food & Dining", emoji: "🍔" },
  { name: "Sports & Fitness", emoji: "🏋️" },
] as const;

export const LOCATION_OPTIONS = [
  "New York",
  "California",
  "London",
  "Tokyo",
  "Paris",
  "Hyderabad",
  "Mumbai",
  "Bangalore",
  "Delhi",
  "Chennai",
];

export function saveInterests(prefs: string[]) {
  sessionStorage.setItem(INTERESTS_KEY, JSON.stringify(prefs));
}

export function getInterests(): string[] {
  try {
    const raw = sessionStorage.getItem(INTERESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
