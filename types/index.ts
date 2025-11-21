export interface Category {
  id: string;
  name: string;
  values: string[];
  defaultValue?: string;
  valueShortNames?: Record<string, string>; // Maps full value name to short name
  trackTime?: boolean; // If true, allows recording start time for this category
  isCounter?: boolean; // If true, this category is a counter field
  visible?: boolean; // If false, hides the category in edit view (defaults to true)
}

export interface SelectionWithTime {
  value: string;
  startTime?: string; // HH:MM format (e.g., "09:30")
}

export interface DayEntry {
  date: string; // YYYY-MM-DD format
  selections: Record<string, string | SelectionWithTime | number>; // categoryId -> value (legacy), SelectionWithTime, or counter number
  notes?: string; // Optional notes for the day
}

export interface AppData {
  categories: Category[];
  entries: DayEntry[];
}

