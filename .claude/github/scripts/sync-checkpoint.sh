#!/bin/bash

# Git Worktree Automation - Sync Checkpoint
# Purpose: Sync checkpoint to GitHub issue comment
# Usage: ./sync-checkpoint.sh <checkpoint-file> <issue-number>
# Example: ./sync-checkpoint.sh checkpoint-day2.md 123
# Requires: GitHub MCP enabled (/mcp enable github in Claude Code)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
  echo -e "${RED}Error: Missing arguments${NC}"
  echo "Usage: $0 <checkpoint-file> <issue-number>"
  echo "Example: $0 checkpoint-day2.md 123"
  exit 1
fi

CHECKPOINT_FILE=$1
ISSUE_NUMBER=$2

# Check if checkpoint file exists
if [ ! -f "$CHECKPOINT_FILE" ]; then
  echo -e "${RED}Error: Checkpoint file not found: ${CHECKPOINT_FILE}${NC}"
  exit 1
fi

# Get repository info from git remote
REPO_URL=$(git remote get-url origin)
if [[ $REPO_URL =~ github.com[:/]([^/]+)/([^/.]+) ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
else
  echo -e "${RED}Error: Could not extract owner/repo from remote URL${NC}"
  echo "Remote URL: ${REPO_URL}"
  exit 1
fi

echo -e "${YELLOW}Syncing checkpoint to GitHub issue${NC}"
echo "Repository: ${OWNER}/${REPO}"
echo "Issue: #${ISSUE_NUMBER}"
echo "Checkpoint file: ${CHECKPOINT_FILE}"
echo ""

# Read checkpoint content
CHECKPOINT_CONTENT=$(cat "$CHECKPOINT_FILE")

# Get current worktree info
WORKTREE_PATH=$(pwd)
CURRENT_BRANCH=$(git branch --show-current)

# Prepare comment body
COMMENT_BODY="## Checkpoint Update

**Worktree**: \`${WORKTREE_PATH}\`
**Branch**: \`${CURRENT_BRANCH}\`
**File**: \`${CHECKPOINT_FILE}\`
**Timestamp**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

---

${CHECKPOINT_CONTENT}

---

🤖 Synced via git worktree automation
"

echo -e "${YELLOW}Creating GitHub issue comment...${NC}"
echo ""
echo -e "${YELLOW}Note: This requires GitHub MCP to be enabled in Claude Code${NC}"
echo "If you see an error, enable GitHub MCP first:"
echo "  /mcp enable github"
echo ""

# Create temporary file with MCP command
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << EOF
Please use the GitHub MCP tool to add this comment to issue #${ISSUE_NUMBER}:

Repository: ${OWNER}/${REPO}
Issue Number: ${ISSUE_NUMBER}

Comment Body:
${COMMENT_BODY}

Use: mcp__github__add_issue_comment
EOF

echo -e "${YELLOW}MCP command prepared in: ${TEMP_FILE}${NC}"
echo ""
echo -e "${GREEN}To complete sync:${NC}"
echo "1. Open Claude Code in this worktree"
echo "2. Ensure GitHub MCP is enabled: /mcp enable github"
echo "3. Run: cat ${TEMP_FILE}"
echo "4. Copy the content and paste into Claude Code"
echo "5. Claude will execute the mcp__github__add_issue_comment tool"
echo ""
echo -e "${YELLOW}Or use the GitHub CLI (gh):${NC}"
echo "gh issue comment ${ISSUE_NUMBER} --body-file ${TEMP_FILE}"
echo ""

# Alternative: Use gh CLI if available
if command -v gh &> /dev/null; then
  echo -e "${YELLOW}GitHub CLI detected. Attempting direct sync...${NC}"

  # Create comment body file
  COMMENT_FILE=$(mktemp)
  echo "$COMMENT_BODY" > "$COMMENT_FILE"

  if gh issue comment "$ISSUE_NUMBER" --body-file "$COMMENT_FILE"; then
    echo -e "${GREEN}✓ Checkpoint synced successfully via GitHub CLI!${NC}"
    rm "$COMMENT_FILE"
    rm "$TEMP_FILE"
    exit 0
  else
    echo -e "${RED}GitHub CLI sync failed. Use manual method above.${NC}"
    rm "$COMMENT_FILE"
  fi
else
  echo -e "${YELLOW}GitHub CLI not found. Use manual method above.${NC}"
fi

# Keep temp file for manual sync
echo ""
echo -e "${YELLOW}Temp file preserved for manual sync: ${TEMP_FILE}${NC}"
echo "Delete after syncing: rm ${TEMP_FILE}"
