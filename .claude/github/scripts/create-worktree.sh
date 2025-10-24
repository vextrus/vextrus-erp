#!/bin/bash

# Git Worktree Automation - Create Worktree
# Purpose: Automated worktree creation with branch setup
# Usage: ./create-worktree.sh <feature-name> <service-name>
# Example: ./create-worktree.sh payment-reconciliation finance

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
  echo -e "${RED}Error: Missing arguments${NC}"
  echo "Usage: $0 <feature-name> <service-name>"
  echo "Example: $0 payment-reconciliation finance"
  exit 1
fi

FEATURE_NAME=$1
SERVICE_NAME=$2
BRANCH_NAME="feature/${SERVICE_NAME}-${FEATURE_NAME}"
WORKTREE_DIR="../vextrus-${FEATURE_NAME}"

echo -e "${YELLOW}Creating worktree for feature: ${FEATURE_NAME}${NC}"
echo "Branch: ${BRANCH_NAME}"
echo "Directory: ${WORKTREE_DIR}"
echo ""

# Check if worktree directory already exists
if [ -d "$WORKTREE_DIR" ]; then
  echo -e "${RED}Error: Worktree directory already exists: ${WORKTREE_DIR}${NC}"
  echo "Please remove it first or use a different feature name"
  exit 1
fi

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
  echo -e "${RED}Error: Branch already exists: ${BRANCH_NAME}${NC}"
  echo "Please delete it first: git branch -D ${BRANCH_NAME}"
  exit 1
fi

# Get current branch to use as base
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Creating branch from: ${CURRENT_BRANCH}${NC}"

# Create worktree with new branch
echo -e "${YELLOW}Creating worktree...${NC}"
git worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME"

# Copy service-specific CLAUDE.md if exists
SERVICE_CLAUDE_FILE="services/${SERVICE_NAME}/CLAUDE.md"
if [ -f "$SERVICE_CLAUDE_FILE" ]; then
  echo -e "${YELLOW}Copying service-specific CLAUDE.md...${NC}"
  cp "$SERVICE_CLAUDE_FILE" "${WORKTREE_DIR}/"
  echo -e "${GREEN}✓ Copied ${SERVICE_CLAUDE_FILE} to worktree${NC}"
fi

# Copy .claude directory (skills, agents, workflows)
echo -e "${YELLOW}Copying .claude directory...${NC}"
cp -r .claude "${WORKTREE_DIR}/"
echo -e "${GREEN}✓ Copied .claude directory to worktree${NC}"

# Success message
echo ""
echo -e "${GREEN}✓ Worktree created successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. cd ${WORKTREE_DIR}"
echo "2. claude  # Start Claude Code in the worktree"
echo "3. Work on your feature independently"
echo ""
echo -e "${YELLOW}When complete:${NC}"
echo "1. cd back to main worktree"
echo "2. git merge ${BRANCH_NAME}"
echo "3. ./.claude/github/scripts/cleanup-worktrees.sh ${FEATURE_NAME}"
echo ""

# List current worktrees
echo -e "${YELLOW}Current worktrees:${NC}"
git worktree list
