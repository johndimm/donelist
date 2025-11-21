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
  const [highlightFilter, setHighlightFilter] = useState<{ categoryId: string; value: string | number } | null>(null);

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
    
    const selection = entry.selections[highlightFilter.categoryId];
    if (!selection) return false;
    
    if (typeof highlightFilter.value === 'number') {
      return typeof selection === 'number' && selection === highlightFilter.value;
    } else {
      const value = getSelectionValue(selection);
      return value === highlightFilter.value;
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
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!todayVisible && (
            <button
              onClick={goToToday}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                fontSize: '0.9rem',
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
              padding: '0.5rem',
              borderRadius: '6px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '36px',
              height: '36px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', minWidth: '200px', margin: 0 }}>
            {viewMode === 'week' 
              ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[13].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : monthName}
          </h2>
          <button
            onClick={() => viewMode === 'week' ? navigateWeek(1) : navigateMonth(1)}
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '36px',
              height: '36px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            backgroundColor: viewMode === 'week' ? '#0070f3' : 'white',
            color: viewMode === 'week' ? 'white' : '#333',
            border: '1px solid #ddd',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            height: '36px',
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
          <CalendarIcon size={16} />
          {viewMode === 'week' ? 'Month View' : 'Week View'}
        </button>
      </div>

      {viewMode === 'week' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '1rem',
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
                  borderRadius: '8px',
                  padding: '1rem',
                  border: isToday ? '2px solid #0070f3' : isHighlighted ? '2px solid #ffc107' : '1px solid #ddd',
                  cursor: 'pointer',
                  minHeight: '150px',
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
                  marginBottom: '0.5rem',
                  color: isToday ? '#0070f3' : '#333',
                }}>
                  {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {selections.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: notes ? '0.5rem' : 0 }}>
                      {selections.map((sel, i) => {
                        const isSelected = highlightFilter?.categoryId === sel.categoryId && highlightFilter?.value === sel.value;
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
                            onClick={(e) => handleSelectionClick(e, sel.categoryId, sel.value)}
                            style={{ 
                              marginBottom: '0.25rem',
                              cursor: 'pointer',
                              padding: '0.125rem 0.25rem',
                              borderRadius: '3px',
                              backgroundColor: isSelected ? '#ffc107' : 'transparent',
                              fontWeight: isSelected ? '600' : 'normal',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#f0f0f0';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <span style={{ fontWeight: '600' }}>{sel.categoryName}:</span> {displayValue}{timeDisplay}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {notes && (
                    <div style={{
                      marginTop: selections.length > 0 ? '0.5rem' : 0,
                      paddingTop: selections.length > 0 ? '0.5rem' : 0,
                      borderTop: selections.length > 0 ? '1px solid #e0e0e0' : 'none',
                      fontSize: '0.8rem',
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
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                textAlign: 'center',
                fontWeight: '600',
                padding: '0.5rem',
                color: '#666',
              }}>
                {day}
              </div>
            ))}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem',
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
                    borderRadius: '6px',
                    padding: '0.75rem',
                    border: isToday ? '2px solid #0070f3' : isHighlighted ? '2px solid #ffc107' : '1px solid #ddd',
                    cursor: 'pointer',
                    minHeight: '150px',
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
                    marginBottom: '0.5rem',
                    color: isToday ? '#0070f3' : '#333',
                  }}>
                    {date.getDate()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {selections.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, marginBottom: notes ? '0.5rem' : 0 }}>
                        {selections.map((sel, i) => {
                          const isSelected = highlightFilter?.categoryId === sel.categoryId && highlightFilter?.value === sel.value;
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
                              onClick={(e) => handleSelectionClick(e, sel.categoryId, sel.value)}
                              style={{ 
                                marginBottom: '0.25rem',
                                cursor: 'pointer',
                                padding: '0.125rem 0.25rem',
                                borderRadius: '3px',
                                backgroundColor: isSelected ? '#ffc107' : 'transparent',
                                fontWeight: isSelected ? '600' : 'normal',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <span style={{ fontWeight: '600' }}>{sel.categoryName}:</span> {displayValue}{timeDisplay}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {notes && (
                      <div style={{
                        marginTop: selections.length > 0 ? '0.5rem' : 0,
                        paddingTop: selections.length > 0 ? '0.5rem' : 0,
                        borderTop: selections.length > 0 ? '1px solid #e0e0e0' : 'none',
                        fontSize: '0.8rem',
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
      )}
    </div>
  );
}

