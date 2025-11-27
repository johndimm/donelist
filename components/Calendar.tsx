'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [highlightFilter, setHighlightFilter] = useState<{ categoryId?: string; value?: string | number } | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [columnsPerRow, setColumnsPerRow] = useState(7);
  const [weeksToShow, setWeeksToShow] = useState(4); // Default: this week + last 3 weeks
  const [dayOffset, setDayOffset] = useState(0); // Offset to show different 7-day windows
  const [daysPerRow, setDaysPerRow] = useState(7); // Number of days that fit per row
  const calendarGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      setIsNarrow(width < 900);
      
      // Calculate how many days can fit per row: use all available width
      // Account for main padding (2rem = 32px on each side = 64px total, or 0.5rem = 8px on narrow)
      const mainPadding = width < 900 ? 16 : 64;
      const gap = width < 900 ? 8 : 16; // gap in pixels
      const minDayWidth = 200; // minimum day width in pixels
      const availableWidth = width - mainPadding;
      // Use a more generous calculation since we're using minmax which allows flexibility
      // The minmax allows days to be slightly smaller if needed
      // Calculate with a smaller effective width to allow more days to fit
      const effectiveMinWidth = minDayWidth * 0.90; // Allow 10% smaller for flexibility
      const calculatedDays = Math.floor((availableWidth + gap) / (effectiveMinWidth + gap));
      // Cap at 7 and ensure at least 1
      const daysThatFit = Math.max(1, Math.min(7, calculatedDays));
      setColumnsPerRow(daysThatFit);
      setDaysPerRow(daysThatFit);
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

  function getWeekDates(date: Date, numWeeks: number = 4): Date[] {
    const dateCopy = new Date(date);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day;
    const startOfThisWeek = new Date(dateCopy);
    startOfThisWeek.setDate(diff);
    
    const dates: Date[] = [];
    // Generate weeks going backwards from this week
    // Start from the oldest week and work forward to this week
    for (let week = numWeeks - 1; week >= 0; week--) {
      const weekStart = new Date(startOfThisWeek);
      weekStart.setDate(startOfThisWeek.getDate() - (week * 7));
      // Add 7 days for this week
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        dates.push(d);
      }
    }
    return dates; // Oldest days first, newest (this week) at the end
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

    // Create a map of category ID to index for sorting
    const categoryIndexMap = new Map<string, number>();
    categories.forEach((cat, index) => {
      categoryIndexMap.set(cat.id, index);
    });

    const selections: SelectionDisplay[] = [];
    Object.entries(entry.selections).forEach(([categoryId, selection]) => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;
      
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
    
    // Sort selections by the order they appear in the categories array
    selections.sort((a, b) => {
      const indexA = categoryIndexMap.get(a.categoryId) ?? Infinity;
      const indexB = categoryIndexMap.get(b.categoryId) ?? Infinity;
      return indexA - indexB;
    });
    
    return selections;
  }

  function isDayHighlighted(date: Date): boolean {
    if (!highlightFilter) return false;
    const dateStr = formatDate(date);
    const entry = entries.find(e => e.date === dateStr);
    if (!entry) return false;
    
    // If highlighting by category only (any value)
    if (highlightFilter.categoryId && highlightFilter.value === undefined) {
      return entry.selections.hasOwnProperty(highlightFilter.categoryId);
    }
    
    // If highlighting by value only (any category)
    if (highlightFilter.value !== undefined && !highlightFilter.categoryId) {
      return Object.values(entry.selections).some(selection => {
        if (typeof highlightFilter.value === 'number') {
          return typeof selection === 'number' && selection === highlightFilter.value;
        } else {
          const value = getSelectionValue(selection);
          return value === highlightFilter.value;
        }
      });
    }
    
    // If highlighting by both category and value (original behavior)
    if (highlightFilter.categoryId && highlightFilter.value !== undefined) {
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
  
  function isSelectionLineHighlighted(categoryId: string, value: string | number): boolean {
    if (!highlightFilter) return false;
    
    // If highlighting by category only
    if (highlightFilter.categoryId && highlightFilter.value === undefined) {
      return categoryId === highlightFilter.categoryId;
    }
    
    // If highlighting by value only
    if (highlightFilter.value !== undefined && !highlightFilter.categoryId) {
      if (typeof highlightFilter.value === 'number') {
        return typeof value === 'number' && value === highlightFilter.value;
      } else {
        return value === highlightFilter.value;
      }
    }
    
    // If highlighting by both
    if (highlightFilter.categoryId && highlightFilter.value !== undefined) {
      return categoryId === highlightFilter.categoryId && value === highlightFilter.value;
    }
    
    return false;
  }

  function handleCategoryClick(e: React.MouseEvent, categoryId: string) {
    e.stopPropagation(); // Prevent day click
    if (highlightFilter && highlightFilter.categoryId === categoryId && highlightFilter.value === undefined) {
      // Clicking the same category again clears the highlight
      setHighlightFilter(null);
    } else {
      setHighlightFilter({ categoryId });
    }
  }
  
  function handleValueClick(e: React.MouseEvent, value: string | number) {
    e.stopPropagation(); // Prevent day click
    if (highlightFilter && !highlightFilter.categoryId && highlightFilter.value === value) {
      // Clicking the same value again clears the highlight
      setHighlightFilter(null);
    } else {
      setHighlightFilter({ value });
    }
  }
  
  function handleSelectionClick(e: React.MouseEvent, categoryId: string, value: string | number) {
    e.stopPropagation(); // Prevent day click
    if (highlightFilter && highlightFilter.categoryId === categoryId && highlightFilter.value === value) {
      // Clicking the same selection again clears the highlight
      setHighlightFilter(null);
    } else {
      setHighlightFilter({ categoryId, value });
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

  function navigateWeek(direction: number, currentVisibleDays: number) {
    // Navigate by changing which days are shown
    // direction: -1 = previous (older days/past), 1 = next (newer days/future)
    // Move by the number of days actually visible on the current page
    setDayOffset(prev => {
      // direction 1 (next) = show newer days = decrease offset (move towards end of array)
      // direction -1 (prev) = show older days = increase offset (move towards start of array)
      const newOffset = prev - (direction * currentVisibleDays);
      console.log('Navigate: direction=', direction, 'currentVisibleDays=', currentVisibleDays, 'prev offset=', prev, 'new offset=', newOffset);
      // Ensure offset doesn't go negative
      return Math.max(0, newOffset);
    });
  }
  
  function loadMoreWeeks() {
    setWeeksToShow(prev => prev + 4); // Load 4 more weeks
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
      const weekDates = getWeekDates(new Date(), weeksToShow);
      return weekDates.some(date => formatDate(date) === todayStr);
    } else {
      const monthDates = getMonthDates(new Date(currentDate));
      return monthDates.some(date => {
        const dateStr = formatDate(date);
        return dateStr === todayStr && date.getMonth() === currentDate.getMonth();
      });
    }
  }

  // Find the earliest date with data
  const earliestDate = entries.length > 0 
    ? entries.reduce((earliest, entry) => {
        const entryDate = parseDate(entry.date);
        return entryDate < earliest ? entryDate : earliest;
      }, parseDate(entries[0].date))
    : new Date();

  // Get today's date
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // Generate dates from earliest date to today
  const allWeekDates: Date[] = [];
  const startDate = new Date(earliestDate);
  // Start from the beginning of the week containing the earliest date
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  // End at the end of this week
  const endDate = new Date(todayDate);
  const endDayOfWeek = endDate.getDay();
  endDate.setDate(endDate.getDate() + (6 - endDayOfWeek)); // End of this week
  
  const dateIterator = new Date(startDate);
  while (dateIterator <= endDate) {
    allWeekDates.push(new Date(dateIterator));
    dateIterator.setDate(dateIterator.getDate() + 1);
  }

  const monthDates = getMonthDates(new Date(currentDate));
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayVisible = isTodayVisible();
  
  // Use the calculated daysPerRow from state (updated on window resize)
  
  // Show up to 4 rows (lines) of days
  // dayOffset determines which days to show (0 = most recent days)
  const maxRows = 4;
  const maxDaysToShow = maxRows * daysPerRow;
  // Find today's index in allWeekDates to ensure we show today
  const todayStr = formatDate(todayDate);
  const todayIndexInAllDates = allWeekDates.findIndex(date => formatDate(date) === todayStr);
  
  // Calculate start index: always use offset-based calculation, but cap at today to avoid future days
  // The actual end of data is today (not the end of the week)
  const dataEndIndex = todayIndexInAllDates >= 0 ? todayIndexInAllDates + 1 : allWeekDates.length;
  const maxOffset = Math.max(0, dataEndIndex - maxDaysToShow);
  const actualOffset = Math.min(dayOffset, maxOffset);
  let startIndex = Math.max(0, dataEndIndex - maxDaysToShow - actualOffset);
  let endIndex = Math.min(dataEndIndex, startIndex + maxDaysToShow);
  
  // Ensure we show at least some days if possible
  if (startIndex >= endIndex && dataEndIndex > 0) {
    startIndex = Math.max(0, dataEndIndex - maxDaysToShow);
    endIndex = dataEndIndex;
  }
  
  const visibleDays = allWeekDates.slice(startIndex, endIndex);
  const firstVisibleDate = visibleDays.length > 0 ? visibleDays[0] : allWeekDates[0];
  const lastVisibleDate = visibleDays.length > 0 ? visibleDays[visibleDays.length - 1] : allWeekDates[allWeekDates.length - 1];
  
  // Find today's index to scroll to it on mount
  const todayIndex = visibleDays.findIndex(date => formatDate(date) === todayStr);
  
  // Reset dayOffset when weeksToShow changes to show most recent days
  useEffect(() => {
    setDayOffset(0);
  }, [weeksToShow]);

  if (!mounted) return null;

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
            onClick={() => viewMode === 'week' ? navigateWeek(-1, visibleDays.length) : navigateMonth(-1)}
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
              ? `${firstVisibleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastVisibleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : monthName}
          </h2>
          <button
            onClick={() => viewMode === 'week' ? navigateWeek(1, visibleDays.length) : navigateMonth(1)}
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
        <>
          <div 
            ref={calendarGridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${daysPerRow}, minmax(200px, 1fr))`,
              gap: isNarrow ? '8px' : '16px',
              width: '100%',
              overflowX: 'auto',
            }}>
            {visibleDays.map((date, idx) => {
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
                  minWidth: '200px',
                  width: '100%',
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
                        const isLineHighlighted = isSelectionLineHighlighted(sel.categoryId, sel.value);
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
                              backgroundColor: isLineHighlighted ? '#ffc107' : 'transparent',
                              transition: 'background-color 0.2s',
                              display: 'flex',
                              flexWrap: 'nowrap',
                              alignItems: 'baseline',
                              minWidth: 0,
                            }}
                          >
                            <span 
                              onClick={(e) => handleCategoryClick(e, sel.categoryId)}
                              style={{ 
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '0.125rem 0.25rem',
                                borderRadius: '3px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e0e0e0';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {sel.categoryName}:
                            </span>
                            <span
                              onClick={(e) => handleValueClick(e, sel.value)}
                              style={{
                                cursor: 'pointer',
                                padding: '0.125rem 0.25rem',
                                borderRadius: '3px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                flexShrink: 1,
                                minWidth: 0,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e0e0e0';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
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
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              onClick={loadMoreWeeks}
              style={{
                padding: isNarrow ? '0.5rem 1rem' : '0.75rem 1.5rem',
                borderRadius: '6px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: '1px solid #0070f3',
                fontSize: isNarrow ? '0.85rem' : '1rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0051cc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0070f3';
              }}
            >
              More
            </button>
          </div>
        </>
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
                          const isLineHighlighted = isSelectionLineHighlighted(sel.categoryId, sel.value);
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
                                backgroundColor: isLineHighlighted ? '#ffc107' : 'transparent',
                                transition: 'background-color 0.2s',
                              }}
                            >
                              <span 
                                onClick={(e) => handleCategoryClick(e, sel.categoryId)}
                                style={{ 
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  padding: '0.05rem 0.15rem',
                                  borderRadius: '3px',
                                  marginRight: '0.25rem',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {sel.categoryName}:
                              </span>
                              <span
                                onClick={(e) => handleValueClick(e, sel.value)}
                                style={{
                                  cursor: 'pointer',
                                  padding: '0.05rem 0.15rem',
                                  borderRadius: '3px',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
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

