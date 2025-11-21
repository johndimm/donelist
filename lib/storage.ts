import { AppData, Category, DayEntry } from '@/types';

const STORAGE_KEY = 'rut-app-data';

const defaultData: AppData = {
  categories: [],
  entries: [],
};

export function loadData(): AppData {
  if (typeof window === 'undefined') {
    return defaultData;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultData;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
}

export function getDayEntry(date: string): DayEntry | null {
  const data = loadData();
  return data.entries.find(entry => entry.date === date) || null;
}

export function saveDayEntry(entry: DayEntry): void {
  const data = loadData();
  const existingIndex = data.entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    data.entries[existingIndex] = entry;
  } else {
    data.entries.push(entry);
  }
  
  saveData(data);
}

export function getCategories(): Category[] {
  const data = loadData();
  return data.categories;
}

export function saveCategory(category: Category): void {
  const data = loadData();
  const existingIndex = data.categories.findIndex(c => c.id === category.id);
  
  if (existingIndex >= 0) {
    data.categories[existingIndex] = category;
  } else {
    data.categories.push(category);
  }
  
  saveData(data);
}

export function deleteCategory(categoryId: string): void {
  const data = loadData();
  data.categories = data.categories.filter(c => c.id !== categoryId);
  
  // Remove selections for this category from all entries
  data.entries = data.entries.map(entry => {
    const { [categoryId]: _, ...rest } = entry.selections;
    return { ...entry, selections: rest };
  });
  
  saveData(data);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function exportData(): string {
  const data = loadData();
  return JSON.stringify(data, null, 2);
}

export function importData(jsonData: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot import data on server' };
  }

  try {
    const data = JSON.parse(jsonData);
    
    // Validate the data structure
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid data format' };
    }
    
    if (!Array.isArray(data.categories) || !Array.isArray(data.entries)) {
      return { success: false, error: 'Invalid data structure: missing categories or entries' };
    }
    
    // Save the imported data
    saveData(data);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse JSON data' 
    };
  }
}

