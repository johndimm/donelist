#!/bin/bash
# Script to fix date shift issue
# Opens the fix page in your browser

echo "Opening date fix page..."
echo "The fix will run automatically when the page loads."

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:3003/fix-dates"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "http://localhost:3003/fix-dates"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start "http://localhost:3003/fix-dates"
else
    echo "Please manually open: http://localhost:3003/fix-dates"
fi

