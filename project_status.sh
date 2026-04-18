#!/bin/bash
# Project status update script for StudioOS
# Designed to be run via cron to provide regular updates

PROJECT_DIR="/Users/cb/.openclaw/workspace/workspace-6982ea72-884f-49b3-bd31-fa19188d28c2"
LOG_FILE="$PROJECT_DIR/logs/project_status.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure logs directory exists
mkdir -p "$(dirname "$LOG_FILE")"

echo "=== Project Status Update: $TIMESTAMP ===" >> "$LOG_FILE"

# Check build status
if cd "$PROJECT_DIR" && bun run build >/dev/null 2>&1; then
    echo "✅ BUILD: SUCCESS" >> "$LOG_FILE"
else
    echo "❌ BUILD: FAILED" >> "$LOG_FILE"
fi

# Check lint status
if cd "$PROJECT_DIR" && bun run lint >/dev/null 2>&1; then
    echo "✅ LINT: PASSED (0 errors)" >> "$LOG_FILE"
else
    echo "❌ LINT: FAILED" >> "$LOG_FILE"
fi

# Check for recent error logs
ERROR_COUNT=$(find "$PROJECT_DIR" -name "*.log" -o -name "*.err" -o -name "error*" 2>/dev/null | xargs grep -i "error\|fail\|panic" 2>/dev/null | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✅ ERRORS: NONE DETECTED" >> "$LOG_FILE"
else
    echo "⚠️  ERRORS: $ERROR_COUNT POTENTIAL ISSUES FOUND" >> "$LOG_FILE"
fi

# Check if key directories exist
if [ -d "$PROJECT_DIR/src" ] && [ -d "$PROJECT_DIR/prisma" ]; then
    echo "✅ PROJECT STRUCTURE: INTACT" >> "$LOG_FILE"
else
    echo "❌ PROJECT STRUCTURE: ISSUES DETECTED" >> "$LOG_FILE"
fi

# Check environment file
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "✅ ENVIRONMENT: CONFIGURED" >> "$LOG_FILE"
else
    echo "⚠️  ENVIRONMENT: TEMPLATE ONLY (.env.example exists)" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "--- End of Update ---" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"