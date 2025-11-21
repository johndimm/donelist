# User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Calendar View](#calendar-view)
4. [Day Editing](#day-editing)
5. [Categories](#categories)
6. [Time Tracking](#time-tracking)
7. [Counter Fields](#counter-fields)
8. [Notes](#notes)
9. [Data Management](#data-management)
10. [Tips & Best Practices](#tips--best-practices)

---

## Introduction

This is a daily tracking and journaling application that helps you track activities, habits, and data with as many categories as you want. It's perfect for tracking everything from mood and exercise to productivity metrics and personal goals.

### Key Features
- **Calendar View**: See your tracked data in week or month view
- **Customizable Categories**: Create categories with your own values
- **Time Tracking**: Record when activities started
- **Counter Fields**: Track numeric values that increment/decrement
- **Notes**: Add free-form notes to any day
- **Export/Import**: Back up and restore your data
- **Highlighting**: Filter calendar to see specific selections

---

## Getting Started

### First Time Use

1. **Open the Application**: Navigate to the Done List app in your browser
2. **Create Your First Category**: 
   - Click on any day in the calendar
   - Click the "New" button or "Create First Category"
   - Enter a category name (e.g., "Mood", "Exercise", "Work Hours")
   - Click "Create"

3. **Add Values to Your Category**:
   - In the category card, find the "Add value..." input
   - Type a value name (e.g., "Happy", "Ran 5k", "8 hours")
   - Press Enter or click "Add"
   - Repeat for all possible values

4. **Start Tracking**:
   - Click on any day in the calendar to open it
   - Select values for your categories
   - Add notes if desired
   - Click "Back to Calendar" to see your entries

---

## Calendar View

The calendar is your main view, showing all your tracked data at a glance.

### View Modes

**Week View** (Default):
- Shows 14 days: last week (7 days) and current week (7 days)
- Displays detailed information for each day
- Best for detailed daily tracking

**Month View**:
- Shows the entire month in a traditional calendar grid
- Days from previous/next months are shown in lighter color
- Best for overview and pattern spotting

**Switching Views**:
- Click the "Month View" / "Week View" button (visible on wider screens)
- The button appears in the top right of the calendar navigation

### Navigation

- **Previous/Next**: Use the arrow buttons (← →) to navigate
  - Week view: moves by 2 weeks (14 days)
  - Month view: moves by 1 month
  
- **Today Button**: Appears when today is not visible in the current view
  - Click to jump back to the current date
  
### Day Display

Each day shows:
- **Date**: Day of week and date number
- **Today Indicator**: Today's date has a blue border
- **Selections**: All category selections for that day
  - Format: `Category Name: value @ time` (if time is tracked)
- **Notes**: Any notes added to the day
- **Highlighting**: Days matching your filter highlight in yellow

![Calendar View Example](/calendar-example.png)

*Example calendar view showing a week of tracked data. Notice how days with matching selections (like "Gym: bike-swim") are highlighted in yellow, and today's date (Friday the 21st) has a blue border.*

### Interacting with the Calendar

- **Click a Day**: Opens the day edit page
- **Click a Selection**: Highlights all days with that same selection
  - Click the same selection again to clear the highlight
  - Useful for finding patterns or specific entries
- **Hover**: Days show a subtle lift effect on hover

### Responsive Design

- On screens narrower than 900px, the interface adapts:
  - Smaller buttons and text
  - Fewer columns in week view
  - Month view scrolls horizontally
  - Simplified controls

---

## Day Editing

The day edit page is where you enter and manage your daily data.

![Day Edit View Example](/day-edit-example.png)

*Example day edit view showing multiple category cards. Each card displays the category name, checkboxes for settings (visible, time, counter), and a list of values with options to add short names, track time, or use counter mode.*

### Opening a Day

- Click any day in the calendar view
- Navigate to `/day/[date]` directly (date format: YYYY-MM-DD)

### Day Edit Interface

**Header**:
- Shows the full date (e.g., "Monday, January 15, 2024")
- "Manage" button: Opens category management panel
- "New" button: Creates a new category
- "Close" button: Returns to calendar view

**Notes Section**:
- Large text area at the top
- Add free-form notes for the day
- Auto-saves as you type

**Category Cards**:
- Each category appears as a card
- Shows category name, values, and current selection

### Making Selections

1. **Select a Value**:
   - Click on a value in the category card
   - The selected value highlights in blue
   - Selection saves automatically

2. **Clear a Selection**:
   - Click the selected value again (or the radio button)
   - The selection is removed

3. **Quick Editing**:
   - Click the category name to edit it
   - Type the new name and press Enter or click ✓
   - Press Escape to cancel

---

## Categories

Categories are the foundation of your tracking system. Each category represents something you want to track.

### Creating Categories

1. Click the "New" button in the day edit page
2. Enter a category name
3. Click "Create" or press Enter

### Category Properties

Each category can have:
- **Name**: The category label
- **Values**: List of possible selections
- **Short Names**: Abbreviated versions for calendar display
- **Time Tracking**: Optional time recording
- **Counter Mode**: For numeric tracking

### Managing Category Values

**Adding Values**:
- Use the "Add value..." input at the bottom of each category card
- Type the value name
- Press Enter or click "Add"

**Deleting Values**:
- Click the X button next to any value
- If the value was selected for the current day, the selection is cleared

**Setting Short Names**:
- In the "short" input field next to each value
- Type an abbreviation (e.g., "Ran 5k" → "5k")
- Short names appear in the calendar instead of full values
- Leave empty to use the full value name

### Category Settings

**Time Tracking**:
- Check the "time" checkbox in the category header
- When enabled, selected values can have a start time recorded
- Useful for tracking when activities began

**Counter Mode**:
- Check the "counter" checkbox in the category header
- Transforms the category into a numeric counter
- Use + and - buttons to increment/decrement
- Useful for counting occurrences (e.g., "Cups of Water", "Push-ups")

### Category Management Panel

Click the "Manage" button to open the category manager:
- View all categories at once
- See how many values each category has
- Delete categories (with confirmation)
- **Warning**: Deleting a category removes all selections for that category across all days

### Editing Category Names

- Click directly on the category name to edit
- Or use the edit icon if available
- Changes apply across all days

---

## Time Tracking

Time tracking lets you record when something happened during the day.

### Enabling Time Tracking

1. Open any day in the day edit page
2. Find the category you want to track time for
3. Check the "time" checkbox in the category header

### Recording Times

1. Select a value for the category
2. A time input field appears next to the selected value
3. Enter the time (24-hour format, e.g., 09:30, 14:15)
4. Time is saved automatically

### Viewing Times

- In the calendar view, times appear as: `Category: value @ 09:30`
- In day edit, the time picker shows the current time for the selection

### Notes on Time Tracking

- Time is optional - you can select a value without recording time
- Times use 24-hour format (HH:MM)
- You can remove a time by clearing the time input
- Disabling time tracking removes times from all selections

---

## Counter Fields

Counter fields let you track numeric values that change throughout the day.

### Creating a Counter

1. Open the day edit page
2. Find or create a category
3. Check the "counter" checkbox in the category header
4. The category transforms into a counter interface

### Using Counters

- **Increment**: Click the "+" button to increase the count
- **Decrement**: Click the "-" button to decrease the count
- **Minimum**: Count cannot go below 0
- The current count displays as a large number in the center

### Example Uses

- **Exercise**: Track number of sets completed
- **Water Intake**: Count cups of water drank
- **Mood Scale**: Rate intensity on a 1-10 scale
- **Tasks**: Count completed tasks for the day

### Converting to/from Counter Mode

- **Enabling Counter Mode**: Clears any existing selections and sets counter to 0
- **Disabling Counter Mode**: Removes the counter value
- **Switching**: You can switch between counter and regular mode, but be aware it may clear existing data

---

## Notes

Notes allow you to add free-form text to any day.

### Adding Notes

1. Open the day edit page
2. Find the "Notes" text area at the top
3. Type your notes
4. Notes save automatically as you type

### Viewing Notes

- **In Calendar View**: Notes appear below selections in day cards
- **In Day Edit**: Notes appear in the text area at the top
- Notes support line breaks and multiple paragraphs

### Notes Tips

- Use notes for:
  - Daily reflections
  - Context about your selections
  - Important events or reminders
  - Detailed descriptions of activities

---

## Data Management

Done List stores all data in your browser's localStorage. This means your data stays on your device.

### Exporting Data

1. Click the "Export" button in the top right of the calendar view
2. A JSON file downloads automatically
3. Filename format: `done-list-export-YYYY-MM-DD.json`
4. **Important**: Export regularly to back up your data!

### Importing Data

1. Click the "Import" button in the top right of the calendar view
2. Select a JSON file that was previously exported
3. Your data is replaced with the imported data
4. A success or error message appears
5. The page refreshes automatically

### Data Format

The exported JSON contains:
- **categories**: Array of all your categories
- **entries**: Array of all your day entries

### Data Safety

- **Browser Only**: Data is stored in your browser's localStorage
- **No Cloud**: Data doesn't sync across devices automatically
- **Backup Regularly**: Export your data frequently
- **Clearing Browser Data**: Clearing localStorage will delete your data
- **Multiple Browsers**: Each browser has separate data

### Viewing Raw Data

Navigate to `/view-data` to see your data as formatted JSON. Useful for debugging or manual editing (advanced users only).

---

## Tips & Best Practices

### Category Organization

- **Keep Categories Focused**: Each category should track one type of thing
- **Use Descriptive Names**: Clear category names make tracking easier
- **Limit Values**: Too many values can be overwhelming; 3-7 values per category is ideal
- **Use Short Names**: Short names make the calendar more readable

### Daily Tracking

- **Set a Routine**: Check in at the same time each day
- **Use the Calendar View**: See patterns and trends over time
- **Don't Skip Days**: Even if you have nothing to track, opening the day keeps the habit

### Time Tracking

- **Track Consistently**: If you track time for one activity, track it for similar ones
- **Use Short Names**: Long value names + times can clutter the calendar
- **Review Patterns**: Use highlighting to see when activities typically occur

### Counter Usage

- **Increment Throughout the Day**: Update counters as activities happen
- **Use for Quantifiable Things**: Counters work best for measurable activities
- **Combine with Notes**: Use notes to explain counter values if needed

### Notes Strategy

- **Be Consistent**: Write notes at the same time each day if possible
- **Be Specific**: Include details that help you remember the day
- **Link to Selections**: Reference your category selections in notes for context

### Data Management

- **Regular Exports**: Export your data weekly or monthly
- **Multiple Backups**: Keep exports in different locations (cloud, USB, etc.)
- **Version Your Exports**: Don't overwrite old exports - keep multiple versions
- **Test Imports**: Periodically test that your exports can be imported successfully

### Calendar Navigation

- **Use Highlighting**: Click selections to find patterns across days
- **Switch Views**: Use month view to spot long-term trends
- **Today Button**: Use it when you're navigating far into the past/future

### Keyboard Shortcuts

- **Enter**: Submit forms (category creation, value addition)
- **Escape**: Cancel editing category names

### Troubleshooting

**Data Not Saving**:
- Check browser console for errors
- Ensure localStorage is enabled in your browser
- Try exporting/importing to reset data

**Calendar Not Updating**:
- Refresh the page
- Check that you're saving entries correctly
- Look for JavaScript errors in browser console

**Import Failing**:
- Ensure the file is valid JSON
- Check that it was exported from Done List
- Verify the file structure matches expected format

---

## Advanced Features

### Highlighting/Filtering

The calendar highlighting feature is powerful for pattern recognition:

1. **Click any selection** in the calendar (e.g., "Mood: Happy")
2. All days with that same selection highlight in yellow
3. **Click again** to clear the highlight
4. **Use for**:
   - Finding all days you exercised
   - Seeing when you felt a certain way
   - Tracking frequency of activities
   - Identifying patterns in your data

### URL Navigation

- Day pages: `/day/2024-01-15` (YYYY-MM-DD format)
- You can bookmark specific days
- Share day URLs if needed

### Data Structure (For Developers)

If you need to manually edit your data:

```json
{
  "categories": [
    {
      "id": "unique-id",
      "name": "Category Name",
      "values": ["Value 1", "Value 2"],
      "valueShortNames": { "Value 1": "V1" },
      "trackTime": false,
      "isCounter": false
    }
  ],
  "entries": [
    {
      "date": "2024-01-15",
      "selections": {
        "category-id": "Value 1",
        "category-id-2": { "value": "Value", "startTime": "09:30" },
        "counter-id": 5
      },
      "notes": "Optional notes text"
    }
  ]
}
```

---

## Support & Troubleshooting

### Common Issues

**I can't see my data**:
- Check that you're in the correct browser
- Verify data wasn't cleared from localStorage
- Try importing a backup

**Export/Import not working**:
- Check browser permissions for file downloads
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Verify the JSON file isn't corrupted

**Calendar looks wrong**:
- Refresh the page
- Check your screen width - narrow screens have different layouts
- Clear browser cache if issues persist

**Time tracking not showing**:
- Ensure you've enabled time tracking for the category
- Check that you've selected a value first
- Verify the time format (HH:MM)

### Getting Help

If you encounter issues:
1. Check this guide first
2. Review the browser console for errors
3. Export your data as a backup
4. Try refreshing or clearing browser cache
5. Check browser compatibility

---

## Version Information

This user guide is for Done List. The application uses:
- Next.js 14
- React 18
- TypeScript
- Browser localStorage for data storage

---

## Conclusion

Done List is designed to be simple, flexible, and powerful. Start with a few categories and add more as you discover what works best for your tracking needs. The key is consistency - even a few minutes each day can build valuable insights over time.

Happy tracking! 📊✨

