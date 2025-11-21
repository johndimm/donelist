'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Settings } from 'lucide-react';
import { 
  getCategories, 
  getDayEntry, 
  saveDayEntry, 
  saveCategory, 
  deleteCategory,
  formatDate,
  parseDate 
} from '@/lib/storage';
import { Category, DayEntry, SelectionWithTime } from '@/types';
import CategoryManager from './CategoryManager';

interface DayEditProps {
  date: string;
}

export default function DayEdit({ date }: DayEditProps) {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entry, setEntry] = useState<DayEntry | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [date]);

  function loadData() {
    const cats = getCategories();
    setCategories(cats);
    const dayEntry = getDayEntry(date);
    setEntry(dayEntry || { date, selections: {} });
  }

  // Helper to normalize selection (handle legacy string format)
  function getSelectionValue(selection: string | SelectionWithTime | number | undefined): string {
    if (!selection) return '';
    if (typeof selection === 'number') return '';
    return typeof selection === 'string' ? selection : selection.value;
  }

  // Helper to get start time from selection
  function getSelectionTime(selection: string | SelectionWithTime | number | undefined): string {
    if (!selection || typeof selection === 'string' || typeof selection === 'number') return '';
    return selection.startTime || '';
  }

  // Helper to get counter value from selection
  function getCounterValue(selection: string | SelectionWithTime | number | undefined): number {
    if (typeof selection === 'number') return selection;
    return 0;
  }

  function handleSelectionChange(categoryId: string, value: string) {
    if (!entry) return;
    
    const newSelections = { ...entry.selections };
    if (value === '') {
      delete newSelections[categoryId];
    } else {
      // Preserve existing time if selection already exists
      const existing = newSelections[categoryId];
      const existingTime = getSelectionTime(existing);
      
      if (existingTime) {
        newSelections[categoryId] = { value, startTime: existingTime };
      } else {
        newSelections[categoryId] = value;
      }
    }
    
    const updatedEntry = { ...entry, selections: newSelections };
    setEntry(updatedEntry);
    saveDayEntry(updatedEntry);
  }

  function handleTimeChange(categoryId: string, time: string) {
    if (!entry) return;
    
    const newSelections = { ...entry.selections };
    const currentSelection = newSelections[categoryId];
    const currentValue = getSelectionValue(currentSelection);
    
    if (!currentValue) return; // Can't set time without a value
    
    if (time.trim() === '') {
      // Remove time, keep just value
      newSelections[categoryId] = currentValue;
    } else {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        return; // Invalid format
      }
      newSelections[categoryId] = { value: currentValue, startTime: time };
    }
    
    const updatedEntry = { ...entry, selections: newSelections };
    setEntry(updatedEntry);
    saveDayEntry(updatedEntry);
  }

  function handleCreateCategory() {
    if (!newCategoryName.trim()) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      values: [],
    };

    saveCategory(newCategory);
    setNewCategoryName('');
    setShowNewCategoryForm(false);
    loadData();
  }

  function handleAddValue(categoryId: string, value: string) {
    if (!value.trim()) return;

    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (category.values.includes(value.trim())) return;

    const updatedCategory: Category = {
      ...category,
      values: [...category.values, value.trim()],
    };

    saveCategory(updatedCategory);
    loadData();
  }

  function handleDeleteValue(categoryId: string, value: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const updatedCategory: Category = {
      ...category,
      values: category.values.filter(v => v !== value),
    };

    // Remove short name if it exists
    if (updatedCategory.valueShortNames && updatedCategory.valueShortNames[value]) {
      const { [value]: _, ...rest } = updatedCategory.valueShortNames;
      updatedCategory.valueShortNames = Object.keys(rest).length > 0 ? rest : undefined;
    }

    saveCategory(updatedCategory);
    
    // Remove selection if this value was selected
    if (entry) {
      const currentSelection = entry.selections[categoryId];
      const currentValue = getSelectionValue(currentSelection);
      if (currentValue === value) {
        const newSelections = { ...entry.selections };
        delete newSelections[categoryId];
        const updatedEntry = { ...entry, selections: newSelections };
        setEntry(updatedEntry);
        saveDayEntry(updatedEntry);
      }
    }
    
    loadData();
  }


  function handleSetShortName(categoryId: string, value: string, shortName: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const updatedCategory: Category = {
      ...category,
      valueShortNames: {
        ...category.valueShortNames,
        [value]: shortName.trim() || undefined,
      },
    };

    // Remove the key if shortName is empty
    if (!shortName.trim() && updatedCategory.valueShortNames) {
      const { [value]: _, ...rest } = updatedCategory.valueShortNames;
      updatedCategory.valueShortNames = Object.keys(rest).length > 0 ? rest : undefined;
    }

    saveCategory(updatedCategory);
    loadData();
  }

  function handleToggleTrackTime(categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const updatedCategory: Category = {
      ...category,
      trackTime: !category.trackTime,
    };

    // If disabling time tracking, remove times from all selections for this category
    if (!updatedCategory.trackTime && entry) {
      const newSelections = { ...entry.selections };
      const currentSelection = newSelections[categoryId];
      if (currentSelection && typeof currentSelection !== 'string' && typeof currentSelection !== 'number') {
        newSelections[categoryId] = currentSelection.value;
      }
      const updatedEntry = { ...entry, selections: newSelections };
      setEntry(updatedEntry);
      saveDayEntry(updatedEntry);
    }

    saveCategory(updatedCategory);
    loadData();
  }

  function handleToggleCounter(categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const updatedCategory: Category = {
      ...category,
      isCounter: !category.isCounter,
    };

    // If enabling counter mode, initialize counter to 0 and clear any existing selection
    // If disabling counter mode, clear the counter value
    if (entry) {
      const newSelections = { ...entry.selections };
      if (updatedCategory.isCounter) {
        // Clear any existing selection and initialize counter to 0
        newSelections[categoryId] = 0;
      } else {
        // Remove counter value when disabling counter mode
        if (typeof newSelections[categoryId] === 'number') {
          delete newSelections[categoryId];
        }
      }
      const updatedEntry = { ...entry, selections: newSelections };
      setEntry(updatedEntry);
      saveDayEntry(updatedEntry);
    }

    saveCategory(updatedCategory);
    loadData();
  }

  function handleCounterIncrement(categoryId: string) {
    if (!entry) return;
    
    const newSelections = { ...entry.selections };
    const currentValue = getCounterValue(newSelections[categoryId]);
    newSelections[categoryId] = currentValue + 1;
    
    const updatedEntry = { ...entry, selections: newSelections };
    setEntry(updatedEntry);
    saveDayEntry(updatedEntry);
  }

  function handleCounterDecrement(categoryId: string) {
    if (!entry) return;
    
    const newSelections = { ...entry.selections };
    const currentValue = getCounterValue(newSelections[categoryId]);
    newSelections[categoryId] = Math.max(0, currentValue - 1);
    
    const updatedEntry = { ...entry, selections: newSelections };
    setEntry(updatedEntry);
    saveDayEntry(updatedEntry);
  }

  function handleStartEditCategoryName(categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setEditingCategoryId(categoryId);
      setEditingCategoryName(category.name);
    }
  }

  function handleSaveCategoryName(categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category || !editingCategoryName.trim()) {
      setEditingCategoryId(null);
      return;
    }

    const updatedCategory: Category = {
      ...category,
      name: editingCategoryName.trim(),
    };

    saveCategory(updatedCategory);
    setEditingCategoryId(null);
    loadData();
  }

  function handleCancelEditCategoryName() {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  }

  function handleNotesChange(notes: string) {
    if (!entry) return;
    
    const updatedEntry = { ...entry, notes: notes || undefined };
    setEntry(updatedEntry);
    saveDayEntry(updatedEntry);
  }

  if (!mounted || !entry) return null;

  const dateObj = parseDate(date);
  const dateDisplay = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
          {dateDisplay}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: showCategoryManager ? '#0070f3' : 'white',
              color: showCategoryManager ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Settings size={14} />
            Manage
          </button>
          {!showNewCategoryForm && (
            <button
              onClick={() => setShowNewCategoryForm(true)}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: '1px solid #0070f3',
                borderRadius: '4px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Plus size={14} />
              New
            </button>
          )}
        </div>
      </div>

      {showCategoryManager && (
        <div style={{ marginBottom: '0.75rem' }}>
          <CategoryManager
            categories={categories}
            onCategoryUpdate={loadData}
            onCategoryDelete={loadData}
          />
        </div>
      )}

      {!showNewCategoryForm && categories.length === 0 && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          textAlign: 'center',
          marginBottom: '0.75rem',
        }}>
          <p style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
            No categories yet. Create your first category to start tracking!
          </p>
          <button
            onClick={() => setShowNewCategoryForm(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Plus size={14} />
            Create First Category
          </button>
        </div>
      )}

      {showNewCategoryForm && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'white',
          borderRadius: '4px',
          border: '1px solid #ddd',
          marginBottom: '0.75rem',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.85rem',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCategory();
                }
              }}
            />
            <button
              onClick={handleCreateCategory}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.85rem',
              }}
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewCategoryForm(false);
                setNewCategoryName('');
              }}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#f0f0f0',
                color: '#333',
                borderRadius: '4px',
                fontSize: '0.85rem',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem', color: '#666' }}>
          Notes:
        </label>
        <textarea
          value={entry.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add notes for this day..."
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            minHeight: '60px',
          }}
        />
      </div>

      {categories.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
          {categories.map(category => {
            const selection = entry.selections[category.id];
            const selectedValue = getSelectionValue(selection);
            const selectedTime = getSelectionTime(selection);
            const counterValue = getCounterValue(selection);

            return (
              <div
                key={category.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}>
                  {editingCategoryId === category.id ? (
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flex: 1 }}>
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveCategoryName(category.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEditCategoryName();
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '0.25rem 0.5rem',
                          border: '1px solid #0070f3',
                          borderRadius: '3px',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                        }}
                      />
                      <button
                        onClick={() => handleSaveCategoryName(category.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#0070f3',
                          color: 'white',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEditCategoryName}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#f0f0f0',
                          color: '#333',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <h3 
                      style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0, cursor: 'pointer' }}
                      onClick={() => handleStartEditCategoryName(category.id)}
                      title="Click to edit category name"
                    >
                      {category.name}
                    </h3>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#666', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={category.trackTime || false}
                        onChange={() => handleToggleTrackTime(category.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      time
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#666', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={category.isCounter || false}
                        onChange={() => handleToggleCounter(category.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      counter
                    </label>
                  </div>
                </div>

                <div style={{
                  padding: '0.5rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}>
                  {category.isCounter ? (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      padding: '1rem',
                    }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: '600', 
                        color: '#0070f3',
                        minHeight: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {counterValue}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleCounterDecrement(category.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#f0f0f0',
                            color: '#333',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            minWidth: '50px',
                          }}
                        >
                          −
                        </button>
                        <button
                          onClick={() => handleCounterIncrement(category.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#0070f3',
                            color: 'white',
                            border: '1px solid #0070f3',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            minWidth: '50px',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        marginBottom: '0.4rem',
                        color: '#666',
                      }}>
                        Values:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        {category.values.map(value => {
                      const shortName = category.valueShortNames?.[value] || '';
                      const isSelected = selectedValue === value;
                      return (
                        <div
                          key={value}
                          onClick={(e) => {
                            // Don't trigger if clicking on inputs or buttons
                            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') {
                              return;
                            }
                            if (isSelected) {
                              handleSelectionChange(category.id, '');
                            } else {
                              handleSelectionChange(category.id, value);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem',
                            backgroundColor: isSelected ? '#e3f2fd' : 'white',
                            border: isSelected ? '1px solid #0070f3' : '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name={category.id}
                            value={value}
                            checked={isSelected}
                            onChange={() => handleSelectionChange(category.id, isSelected ? '' : value)}
                            onClick={(e) => {
                              // Prevent double-triggering when clicking the radio button itself
                              if (isSelected) {
                                e.preventDefault();
                                handleSelectionChange(category.id, '');
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: '500', flex: 1, fontSize: '0.8rem' }}>{value}</span>
                          <input
                            type="text"
                            value={shortName}
                            onChange={(e) => handleSetShortName(category.id, value, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="short"
                            style={{
                              padding: '0.2rem 0.4rem',
                              border: '1px solid #ddd',
                              borderRadius: '3px',
                              fontSize: '0.75rem',
                              width: '70px',
                            }}
                          />
                          {isSelected && category.trackTime && (
                            <input
                              type="time"
                              value={selectedTime}
                              onChange={(e) => handleTimeChange(category.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: '0.3rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                backgroundColor: 'white',
                                width: '90px',
                              }}
                            />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteValue(category.id, value);
                            }}
                            style={{
                              padding: '0.2rem',
                              color: '#999',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Delete value"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <AddValueForm 
                    categoryId={category.id}
                    onAdd={handleAddValue}
                    existingValues={category.values}
                  />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AddValueFormProps {
  categoryId: string;
  onAdd: (categoryId: string, value: string) => void;
  existingValues: string[];
}

function AddValueForm({ categoryId, onAdd, existingValues }: AddValueFormProps) {
  const [newValue, setNewValue] = useState('');

  function handleSubmit() {
    if (!newValue.trim()) return;
    if (existingValues.includes(newValue.trim())) {
      setNewValue('');
      return;
    }
    onAdd(categoryId, newValue.trim());
    setNewValue('');
  }

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <input
        type="text"
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        placeholder="Add value..."
        style={{
          flex: 1,
          padding: '0.3rem 0.5rem',
          border: '1px solid #ddd',
          borderRadius: '3px',
          fontSize: '0.75rem',
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSubmit();
          }
        }}
      />
      <button
        onClick={handleSubmit}
        style={{
          padding: '0.3rem 0.6rem',
          backgroundColor: '#0070f3',
          color: 'white',
          borderRadius: '3px',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
        }}
      >
        <Plus size={12} />
        Add
      </button>
    </div>
  );
}

