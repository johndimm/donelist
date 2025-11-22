'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { loadData, formatDate, parseDate, getDayEntry } from '@/lib/storage';
import { Category, DayEntry, SelectionWithTime } from '@/types';

type ViewMode = 'week' | 'month';

export default function Calendar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [highlightFilter, setHighlightFilter] = useState<{ categoryId?: string; value?: string | number; filterBy: 'category' | 'value' | 'both' } | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [columnsPerRow, setColumnsPerRow] = useState(7);

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      setIsNarrow(width < 900);
      
      // Calculate how many columns can fit: (width - padding - gaps) / (minDayWidth + gap)
      // Account for main padding (2rem = 32px on each side = 64px total, or 0.5rem = 8px on narrow)
      const mainPadding = width < 900 ? 16 : 64;
      const gap = width < 900 ? 8 : 16; // gap in pixels
      const minDayWidth = width >= 1400 ? 180 : (width >= 1200 ? 160 : 140); // minimum day width in pixels, larger on wider screens
      const availableWidth = width - mainPadding;
      // Calculate: (availableWidth + gap) / (minDayWidth + gap)
      const calculatedColumns = Math.floor((availableWidth + gap) / (minDayWidth + gap));
      // Cap at 7 and ensure at least 1
      // If we can fit 7 columns, always use 7 to maximize horizontal space
      const finalColumns = calculatedColumns >= 7 ? 7 : Math.max(1, calculatedColumns);
      setColumnsPerRow(finalColumns);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    setMounted(true);
    loadCalendarData();
  }, []);

  // Reload data when component becomes visible (e.g., returning from day edit)
  useEffect(() => {
    const handleFocus = () => {
      loadCalendarData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  function loadCalendarData() {
    const data = loadData();
    setCategories(data.categories);
    setEntries(data.entries);
  }

  function getWeekDates(date: Date): Date[] {
    const dateCopy = new Date(date);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day;
    const startOfThisWeek = new Date(dateCopy);
    startOfThisWeek.setDate(diff);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    const dates: Date[] = [];
    // Add last week (7 days)
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfLastWeek);
      d.setDate(startOfLastWeek.getDate() + i);
      dates.push(d);
    }
    // Add this week (7 days)
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfThisWeek);
      d.setDate(startOfThisWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  function getMonthDates(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= lastDay || dates.length < 35) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (dates.length >= 42) break;
    }
    return dates;
  }

  // Helper to get value from selection (handle legacy string format)
  function getSelectionValue(selection: string | SelectionWithTime | number): string {
    if (typeof selection === 'number') return '';
    return typeof selection === 'string' ? selection : selection.value;
  }

  // Helper to get time from selection
  function getSelectionTime(selection: string | SelectionWithTime | number): string | undefined {
    if (typeof selection === 'number' || typeof selection === 'string') return undefined;
    return selection.startTime;
  }

  // Helper to get counter value from selection
  function getCounterValue(selection: string | SelectionWithTime | number): number {
    if (typeof selection === 'number') return selection;
    return 0;
  }

  interface SelectionDisplay {
    categoryId: string;
    categoryName: string;
    value: string | number;
    displayText: string;
  }

  function getDaySelections(date: Date): SelectionDisplay[] {
    const dateStr = formatDate(date);
    const entry = entries.find(e => e.date === dateStr);
    if (!entry) return [];

    const selections: SelectionDisplay[] = [];
    Object.entries(entry.selections).forEach(([categoryId, selection]) => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;
      
      // Skip categories that are marked as not visible
      if (category.visible === false) return;
      
      // Handle counter categories
      if (category.isCounter) {
        const counterValue = getCounterValue(selection);
        selections.push({
          categoryId,
          categoryName: category.name,
          value: counterValue,
          displayText: `${category.name}: ${counterValue}`,
        });
        return;
      }
      
      // Handle regular value selections
      const value = getSelectionValue(selection);
      const time = getSelectionTime(selection);
      
      // Use short name if available, otherwise use full value name
      const displayValue = category.valueShortNames?.[value] || value;
      const timeDisplay = time ? ` @ ${time}` : '';
      selections.push({
        categoryId,
        categoryName: category.name,
        value,
        displayText: `${category.name}: ${displayValue}${timeDisplay}`,
      });
    });
    return selections;
  }

  function isDayHighlighted(date: Date): boolean {
    if (!highlightFilter) return false;
    const dateStr = formatDate(date);
    const entry = entries.find(e => e.date === dateStr);
    if (!entry) return false;
    
    // Filter by category only
    if (highlightFilter.filterBy === 'category' && highlightFilter.categoryId) {
      return entry.selections.hasOwnProperty(highlightFilter.categoryId);
    }
    
    // Filter by value only (across all categories)
    if (highlightFilter.filterBy === 'value' && highlightFilter.value !== undefined) {
      return Object.values(entry.selections).some(selection => {
        if (typeof highlightFilter.value === 'number') {
          return typeof selection === 'number' && selection === highlightFilter.value;
        } else {
          const value = getSelectionValue(selection);
          return value === highlightFilter.value;
        }
      });
    }
    
    // Filter by both (original behavior)
    if (highlightFilter.filterBy === 'both' && highlightFilter.categoryId && highlightFilter.value !== undefined) {
      const selection = entry.selections[highlightFilter.categoryId];
      if (!selection) return false;
      
      if (typeof highlightFilter.value === 'number') {
        return typeof selection === 'number' && selection === highlightFilter.value;
      } else {
        const value = getSelectionValue(selection);
        return value === highlightFilter.value;
      }
    }
    
    return false;
  }

  function handleCategoryClick(e: React.MouseEvent, categoryId: string) {
    e.stopPropagation(); // Prevent day click
    if (highlightFilter?.filterBy === 'category' && highlightFilter.categoryId === categoryId) {
      // Clicking the same category again clears the highlight
      setHighlightFilter(null);
    } else {
      setHighlightFilter({ categoryId, filterBy: 'category' });
    }
  }

  function handleValueClick(e: React.MouseEvent, value: string | number) {
    e.stopPropagation(); // Prevent day click
    if (highlightFilter?.filterBy === 'value' && highlightFilter.value === value) {
      // Clicking the same value again clears the highlight
      setHighlightFilter(null);
    } else {
      setHighlightFilter({ value, filterBy: 'value' });
    }
  }

  function handleSelectionClick(e: React.MouseEvent, categoryId: string, value: string | number) {
    e.stopPropagation(); // Prevent day click
    if (highlightFilter?.filterBy === 'both' && highlightFilter.categoryId === categoryId && highlightFilter.value === value) {
      // Clicking the same selection again clears the highlight
      setHighlightFilter(null);
    } else {
      setHighlightFilter({ categoryId, value, filterBy: 'both' });
    }
  }

  function getDayItemCount(date: Date): number {
    const dateStr = formatDate(date);
    const entry = entries.find(e => e.date === dateStr);
    if (!entry) return 0;
    return Object.keys(entry.selections).length;
  }

  function getDayNotes(date: Date): string | undefined {
    const dateStr = formatDate(date);
    const entry = entries.find(e => e.date === dateStr);
    return entry?.notes;
  }

  function handleDayClick(date: Date) {
    router.push(`/day/${formatDate(date)}`);
  }

  function navigateWeek(direction: number) {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 14)); // Move by 2 weeks (fortnight)
    setCurrentDate(newDate);
  }

  function navigateMonth(direction: number) {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function isTodayVisible(): boolean {
    const today = new Date();
    const todayStr = formatDate(today);
    
    if (viewMode === 'week') {
      const weekDates = getWeekDates(new Date(currentDate));
      return weekDates.some(date => formatDate(date) === todayStr);
    } else {
      const monthDates = getMonthDates(new Date(currentDate));
      return monthDates.some(date => {
        const dateStr = formatDate(date);
        return dateStr === todayStr && date.getMonth() === currentDate.getMonth();
      });
    }
  }

  if (!mounted) return null;

  const weekDates = getWeekDates(new Date(currentDate));
  const monthDates = getMonthDates(new Date(currentDate));
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayVisible = isTodayVisible();

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isNarrow ? '0.75rem' : '1.5rem',
        flexWrap: 'wrap',
        gap: isNarrow ? '0.5rem' : '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!todayVisible && (
            <button
              onClick={goToToday}
              style={{
                padding: isNarrow ? '0.35rem 0.6rem' : '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                fontSize: isNarrow ? '0.75rem' : '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Today
            </button>
          )}
          <button
            onClick={() => viewMode === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
            style={{
              padding: isNarrow ? '0.25rem' : '0.5rem',
              borderRadius: '6px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: isNarrow ? '28px' : '36px',
              height: isNarrow ? '28px' : '36px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <ChevronLeft size={isNarrow ? 16 : 20} />
          </button>
          <h2 style={{ fontSize: isNarrow ? '1rem' : '1.5rem', fontWeight: '600', minWidth: isNarrow ? '120px' : '200px', margin: 0 }}>
            {viewMode === 'week' 
              ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[13].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : monthName}
          </h2>
          <button
            onClick={() => viewMode === 'week' ? navigateWeek(1) : navigateMonth(1)}
            style={{
              padding: isNarrow ? '0.25rem' : '0.5rem',
              borderRadius: '6px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: isNarrow ? '28px' : '36px',
              height: isNarrow ? '28px' : '36px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <ChevronRight size={isNarrow ? 16 : 20} />
          </button>
        </div>
        {columnsPerRow >= 7 && (
          <button
            onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
            style={{
              padding: isNarrow ? '0.35rem 0.6rem' : '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: viewMode === 'week' ? '#0070f3' : 'white',
              color: viewMode === 'week' ? 'white' : '#333',
              border: '1px solid #ddd',
              fontSize: isNarrow ? '0.75rem' : '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: isNarrow ? '0.25rem' : '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: isNarrow ? '28px' : '36px',
            }}
            onMouseEnter={(e) => {
              if (viewMode === 'week') {
                e.currentTarget.style.backgroundColor = '#0051cc';
              } else {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              if (viewMode === 'week') {
                e.currentTarget.style.backgroundColor = '#0070f3';
              } else {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <CalendarIcon size={isNarrow ? 14 : 16} />
            {!isNarrow && (viewMode === 'week' ? 'Month View' : 'Week View')}
          </button>
        )}
      </div>

      {viewMode === 'week' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: columnsPerRow === 7 ? 'repeat(7, 1fr)' : `repeat(${columnsPerRow}, 1fr)`,
          gap: isNarrow ? '0.5rem' : '1rem',
          width: '100%',
        }}>
          {weekDates.map((date, idx) => {
            const dateStr = formatDate(date);
            const isToday = dateStr === formatDate(new Date());
            const selections = getDaySelections(date);
            const notes = getDayNotes(date);
            const isHighlighted = isDayHighlighted(date);
            
            return (
              <div
                key={idx}
                onClick={() => handleDayClick(date)}
                style={{
                  backgroundColor: isHighlighted ? '#fff3cd' : 'white',
                  borderRadius: isNarrow ? '4px' : '8px',
                  padding: isNarrow ? '0.5rem' : '1rem',
                  border: isToday ? '2px solid #0070f3' : isHighlighted ? '2px solid #ffc107' : '1px solid #ddd',
                  cursor: 'pointer',
                  minWidth: columnsPerRow === 7 ? 'auto' : '140px',
                  maxWidth: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  fontWeight: '600', 
                  marginBottom: isNarrow ? '0.4rem' : '0.5rem',
                  fontSize: isNarrow ? '0.8rem' : '0.9rem',
                  color: isToday ? '#0070f3' : '#333',
                }}>
                  {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: isNarrow ? '0.75rem' : '0.85rem', color: '#666' }}>
                  {selections.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: notes ? '0.5rem' : 0 }}>
                      {selections.map((sel, i) => {
                        const isCategorySelected = highlightFilter?.filterBy === 'category' && highlightFilter?.categoryId === sel.categoryId;
                        const isValueSelected = highlightFilter?.filterBy === 'value' && highlightFilter?.value === sel.value;
                        const isBothSelected = highlightFilter?.filterBy === 'both' && highlightFilter?.categoryId === sel.categoryId && highlightFilter?.value === sel.value;
                        const isSelected = isCategorySelected || isValueSelected || isBothSelected;
                        const category = categories.find(c => c.id === sel.categoryId);
                        const entry = entries.find(e => e.date === dateStr);
                        const displayValue = category?.isCounter 
                          ? sel.value 
                          : (category?.valueShortNames?.[sel.value as string] || sel.value);
                        const time = category && !category.isCounter && entry
                          ? getSelectionTime(entry.selections[sel.categoryId])
                          : undefined;
                        const timeDisplay = time ? ` @ ${time}` : '';
                        return (
                          <li 
                            key={i} 
                            style={{ 
                              marginBottom: isNarrow ? '0.2rem' : '0.25rem',
                              padding: isNarrow ? '0.1rem 0.2rem' : '0.125rem 0.25rem',
                              borderRadius: '3px',
                              backgroundColor: isSelected ? '#ffc107' : 'transparent',
                              transition: 'background-color 0.2s',
                              wordBreak: 'break-word',
                            }}
                          >
                            <span 
                              style={{ fontWeight: '600', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryClick(e, sel.categoryId);
                              }}
                              title="Click to highlight this category across all days"
                            >
                              {sel.categoryName}:
                            </span>{' '}
                            <span
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleValueClick(e, sel.value);
                              }}
                              title="Click to highlight this value across all days and categories"
                            >
                              {displayValue}{timeDisplay}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {notes && (
                    <div style={{
                      marginTop: selections.length > 0 ? (isNarrow ? '0.4rem' : '0.5rem') : 0,
                      paddingTop: selections.length > 0 ? (isNarrow ? '0.4rem' : '0.5rem') : 0,
                      borderTop: selections.length > 0 ? '1px solid #e0e0e0' : 'none',
                      fontSize: isNarrow ? '0.7rem' : '0.8rem',
                      fontStyle: 'italic',
                      color: '#555',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div style={{
            overflowX: isNarrow ? 'auto' : 'visible',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            marginBottom: isNarrow ? '0.25rem' : '0.5rem',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isNarrow ? 'repeat(7, 120px)' : 'repeat(7, 1fr)',
              gap: isNarrow ? '0.25rem' : '0.5rem',
              minWidth: isNarrow ? 'max-content' : 'auto',
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{
                  textAlign: 'center',
                  fontWeight: '600',
                  padding: isNarrow ? '0.25rem' : '0.5rem',
                  fontSize: isNarrow ? '0.7rem' : '0.9rem',
                  color: '#666',
                }}>
                  {day}
                </div>
              ))}
            </div>
          </div>
          <div style={{
            overflowX: isNarrow ? 'auto' : 'visible',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isNarrow ? 'repeat(7, 120px)' : 'repeat(7, 1fr)',
              gap: isNarrow ? '0.25rem' : '0.5rem',
              minWidth: isNarrow ? 'max-content' : 'auto',
            }}>
            {monthDates.map((date, idx) => {
              const dateStr = formatDate(date);
              const isToday = dateStr === formatDate(new Date());
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const selections = getDaySelections(date);
              const notes = getDayNotes(date);
              const isHighlighted = isDayHighlighted(date);
              
              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(date)}
                  style={{
                    backgroundColor: isCurrentMonth ? (isHighlighted ? '#fff3cd' : 'white') : '#f9f9f9',
                    borderRadius: isNarrow ? '4px' : '6px',
                    padding: isNarrow ? '0.4rem' : '0.75rem',
                    border: isToday ? '2px solid #0070f3' : isHighlighted ? '2px solid #ffc107' : '1px solid #ddd',
                    cursor: 'pointer',
                    minHeight: isNarrow ? '100px' : '150px',
                    minWidth: isNarrow ? '120px' : 'auto',
                    width: isNarrow ? '120px' : 'auto',
                    opacity: isCurrentMonth ? 1 : 0.5,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (isCurrentMonth) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontWeight: isToday ? '600' : '400',
                    marginBottom: isNarrow ? '0.25rem' : '0.5rem',
                    fontSize: isNarrow ? '0.7rem' : '0.9rem',
                    color: isToday ? '#0070f3' : '#333',
                  }}>
                    {date.getDate()}
                  </div>
                  <div style={{ fontSize: isNarrow ? '0.7rem' : '0.85rem', color: '#666' }}>
                    {selections.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, marginBottom: notes ? '0.5rem' : 0 }}>
                        {selections.map((sel, i) => {
                          const isCategorySelected = highlightFilter?.filterBy === 'category' && highlightFilter?.categoryId === sel.categoryId;
                          const isValueSelected = highlightFilter?.filterBy === 'value' && highlightFilter?.value === sel.value;
                          const isBothSelected = highlightFilter?.filterBy === 'both' && highlightFilter?.categoryId === sel.categoryId && highlightFilter?.value === sel.value;
                          const isSelected = isCategorySelected || isValueSelected || isBothSelected;
                          const category = categories.find(c => c.id === sel.categoryId);
                          const entry = entries.find(e => e.date === dateStr);
                          const displayValue = category?.isCounter 
                            ? sel.value 
                            : (category?.valueShortNames?.[sel.value as string] || sel.value);
                          const time = category && !category.isCounter && entry
                            ? getSelectionTime(entry.selections[sel.categoryId])
                            : undefined;
                          const timeDisplay = time ? ` @ ${time}` : '';
                          return (
                            <li 
                              key={i} 
                              style={{ 
                                marginBottom: isNarrow ? '0.1rem' : '0.25rem',
                                padding: isNarrow ? '0.05rem 0.15rem' : '0.125rem 0.25rem',
                                borderRadius: '3px',
                                backgroundColor: isSelected ? '#ffc107' : 'transparent',
                                transition: 'background-color 0.2s',
                                wordBreak: 'break-word',
                              }}
                            >
                              <span 
                                style={{ fontWeight: '600', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCategoryClick(e, sel.categoryId);
                                }}
                                title="Click to highlight this category across all days"
                              >
                                {sel.categoryName}:
                              </span>{' '}
                              <span
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleValueClick(e, sel.value);
                                }}
                                title="Click to highlight this value across all days and categories"
                              >
                                {displayValue}{timeDisplay}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {notes && (
                      <div style={{
                        marginTop: selections.length > 0 ? (isNarrow ? '0.25rem' : '0.5rem') : 0,
                        paddingTop: selections.length > 0 ? (isNarrow ? '0.25rem' : '0.5rem') : 0,
                        borderTop: selections.length > 0 ? '1px solid #e0e0e0' : 'none',
                        fontSize: isNarrow ? '0.65rem' : '0.8rem',
                        fontStyle: 'italic',
                        color: '#555',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

