#!/bin/bash

# Git Worktree Automation - Cleanup Worktrees
# Purpose: Prune completed worktrees
# Usage: ./cleanup-worktrees.sh <pattern>
# Example: ./cleanup-worktrees.sh invoice-*
# Example: ./cleanup-worktrees.sh payment-reconciliation

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 1 ]; then
  echo -e "${RED}Error: Missing pattern argument${NC}"
  echo "Usage: $0 <pattern>"
  echo "Example: $0 invoice-*"
  echo "Example: $0 payment-reconciliation"
  exit 1
fi

PATTERN=$1

echo -e "${YELLOW}Cleaning up worktrees matching pattern: ${PATTERN}${NC}"
echo ""

# List current worktrees
echo -e "${YELLOW}Current worktrees:${NC}"
git worktree list
echo ""

# Find matching worktrees
MATCHING_WORKTREES=$(git worktree list --porcelain | grep "worktree" | awk '{print $2}' | grep -E "vextrus-${PATTERN}" || true)

if [ -z "$MATCHING_WORKTREES" ]; then
  echo -e "${YELLOW}No worktrees found matching pattern: ${PATTERN}${NC}"
  exit 0
fi

echo -e "${YELLOW}Found matching worktrees:${NC}"
echo "$MATCHING_WORKTREES"
echo ""

# Confirm deletion
echo -e "${RED}WARNING: This will delete the following worktrees:${NC}"
echo "$MATCHING_WORKTREES"
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Cleanup cancelled${NC}"
  exit 0
fi

# Remove each matching worktree
while IFS= read -r worktree; do
  if [ -n "$worktree" ]; then
    echo -e "${YELLOW}Removing worktree: ${worktree}${NC}"

    # Get branch name from worktree
    BRANCH_NAME=$(git worktree list --porcelain | grep -A 3 "worktree ${worktree}" | grep "branch" | awk '{print $2}' | sed 's|refs/heads/||')

    # Remove worktree
    if git worktree remove "$worktree" --force; then
      echo -e "${GREEN}✓ Removed worktree: ${worktree}${NC}"

      # Ask if branch should be deleted
      if [ -n "$BRANCH_NAME" ]; then
        echo -e "${YELLOW}Delete branch ${BRANCH_NAME}? (y/N)${NC}"
        read -p "" -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
          if git branch -D "$BRANCH_NAME"; then
            echo -e "${GREEN}✓ Deleted branch: ${BRANCH_NAME}${NC}"
          else
            echo -e "${RED}Failed to delete branch: ${BRANCH_NAME}${NC}"
          fi
        else
          echo -e "${YELLOW}Branch preserved: ${BRANCH_NAME}${NC}"
        fi
      fi
    else
      echo -e "${RED}Failed to remove worktree: ${worktree}${NC}"
    fi

    echo ""
  fi
done <<< "$MATCHING_WORKTREES"

# Prune stale worktree references
echo -e "${YELLOW}Pruning stale worktree references...${NC}"
git worktree prune
echo -e "${GREEN}✓ Pruned stale references${NC}"
echo ""

# Show remaining worktrees
echo -e "${YELLOW}Remaining worktrees:${NC}"
git worktree list
echo ""

echo -e "${GREEN}✓ Cleanup complete!${NC}"
