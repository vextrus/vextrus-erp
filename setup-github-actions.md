# GitHub Actions Setup Guide

## Current Status
- **Repository**: https://github.com/vextrus/vextrus-erp.git
- **Branch**: feature/productionize-package-registry
- **Test Changeset**: Created and committed

## Required Setup Steps

### 1. GitHub Authentication
You need to authenticate with GitHub first. Run one of these commands:

```bash
# Option A: Interactive login (recommended)
gh auth login

# Option B: Using personal access token
export GITHUB_TOKEN="your-personal-access-token"
gh auth login --with-token
```

### 2. Create GitHub Repository (if not exists)
If the repository doesn't exist yet, create it:

```bash
# Create public repository
gh repo create vextrus/vextrus-erp --public --source=. --remote=origin --push

# OR create private repository
gh repo create vextrus/vextrus-erp --private --source=. --remote=origin --push
```

### 3. Configure GitHub Secrets
Once authenticated, run these commands to set up secrets:

```bash
# Set NPM token for package publishing
gh secret set NPM_TOKEN --body="your-npm-token"

# Generate and set GPG keys
gpg --gen-key
gpg --armor --export-secret-keys your-email@example.com > private.key
gh secret set GPG_PRIVATE_KEY < private.key
gh secret set GPG_KEY_ID --body="your-gpg-key-id"
gh secret set GPG_PASSPHRASE --body="your-gpg-passphrase"

# Optional: Docker Hub credentials
gh secret set DOCKER_USERNAME --body="your-docker-username"
gh secret set DOCKER_PASSWORD --body="your-docker-password"

# Optional: Monitoring webhooks
gh secret set SLACK_WEBHOOK --body="your-slack-webhook-url"
```

### 4. Update Workflow for Production Registry

Create a new file `.github/workflows/release-packages-prod.yml`:

```yaml
name: Release Packages (Production)

on:
  push:
    branches:
      - main
      - feature/productionize-package-registry  # For testing
    paths:
      - 'shared/**'
      - '.changeset/**'
      - 'package.json'
      - 'pnpm-lock.yaml'
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  release:
    name: Release Packages
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      packages: write
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install Dependencies
        run: npm ci

      - name: Build Packages
        run: |
          npm run build --workspace=@vextrus/kernel
          npm run build --workspace=@vextrus/contracts
          npm run build --workspace=@vextrus/utils
          npm run build --workspace=@vextrus/distributed-transactions

      - name: Run Tests
        run: |
          npm run test:run --workspace=@vextrus/utils --if-present
          npm run test:run --workspace=@vextrus/distributed-transactions --if-present

      - name: Setup GPG Key
        if: github.ref == 'refs/heads/main'
        run: |
          echo "${{ secrets.GPG_PRIVATE_KEY }}" | gpg --batch --import
          git config --global user.signingkey ${{ secrets.GPG_KEY_ID }}
          git config --global commit.gpgsign true

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: npm run release
          version: npm run version
          commit: 'chore: release packages'
          title: 'chore: release packages'
          createGithubReleases: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Generate Documentation
        if: steps.changesets.outputs.published == 'true'
        run: npm run docs:generate

      - name: Upload Documentation
        if: steps.changesets.outputs.published == 'true'
        uses: actions/upload-artifact@v3
        with:
          name: api-documentation
          path: docs/api/
          retention-days: 30

      - name: Notify Release
        if: always()
        run: |
          if [ "${{ steps.changesets.outputs.published }}" == "true" ]; then
            echo "✅ Packages Published Successfully!"
            echo "Published packages:"
            echo "${{ steps.changesets.outputs.publishedPackages }}"
          else
            echo "📦 No packages were published in this run"
          fi
```

### 5. Push Branch and Test

```bash
# Push the feature branch
git add .
git commit -m "feat: add production-ready GitHub Actions workflow"
git push -u origin feature/productionize-package-registry
```

### 6. Monitor Workflow

After pushing, monitor the workflow:
```bash
# Watch workflow runs
gh run list --workflow="Release Packages"

# View specific run
gh run view

# Watch live logs
gh run watch
```

## Manual Testing Commands

If you want to test locally first:

```bash
# Test changeset version bump
npx changeset version

# Test package builds
npm run build --workspace=@vextrus/kernel
npm run build --workspace=@vextrus/contracts
npm run build --workspace=@vextrus/utils
npm run build --workspace=@vextrus/distributed-transactions

# Test documentation generation
npm run docs:generate
```

## Troubleshooting

### Common Issues:

1. **Repository not found**: Create the repository first using `gh repo create`
2. **Authentication failed**: Ensure GitHub token has appropriate permissions
3. **Workflow not triggering**: Check branch protection rules and path filters
4. **NPM publish fails**: Verify NPM_TOKEN has publish permissions
5. **GPG signing fails**: Ensure GPG keys are properly configured

### Required GitHub Token Permissions:
- `repo` (full control)
- `workflow` (update workflows)
- `packages:write` (if using GitHub Packages)
- `admin:org` (if organization repository)

## Next Steps After Setup

1. ✅ Authenticate with GitHub CLI
2. ✅ Configure all required secrets
3. ✅ Push feature branch
4. ✅ Monitor first workflow run
5. ⏳ Debug any issues
6. ⏳ Test changeset PR creation
7. ⏳ Validate package publishing
8. ⏳ Switch to production registry